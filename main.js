const moment = require('moment');
const sha256 = require('js-sha256').sha256;

module.exports.templateTags = [{
    name: 's3presignedlink',
    displayName: 'S3 presigned link',
    description: 'Generate S3 presigned link',
    args: [
        {
            displayName: 'Access key',
            description: 'Your Amazon access key',
            type: 'string'
        },
        {
            displayName: 'Secret key',
            description: 'Your Amazon secret key',
            type: 'string'
        },
        {
            displayName: 'File name',
            description: 'Resource name',
            type: 'string'
        },
        {
            displayName: 'Method',
            description: 'HTTP method',
            type: 'enum',
            defaultValue: 'auto',
            options: [
                {
                    displayName: 'Auto',
                    value: 'auto',
                    description: 'Same as request'
                },
                {
                    displayName: 'GET',
                    value: 'GET'
                },
                {
                    displayName: 'POST',
                    value: 'POST'
                },
                {
                    displayName: 'DELETE',
                    value: 'DELETE'
                },
                {
                    displayName: 'PUT',
                    value: 'PUT'
                },
                {
                    displayName: 'PATCH',
                    value: 'PATCH'
                }
            ]
        },
        {
            displayName: 'Bucket',
            description: 'Bucket name',
            type: 'string'
        },
        {
            displayName: 'Region',
            description: 'AWS region',
            type: 'enum',
            options: [
                {"displayName": "US East (Ohio)", "value": "us-east-2"},
                {"displayName": "US East (N. Virginia)", "value": "us-east-1"},
                {"displayName": "US West (N. California)", "value": "us-west-1"},
                {"displayName": "US West (Oregon)", "value": "us-west-2"},
                {"displayName": "Africa (Cape Town)", "value": "af-south-1"},
                {"displayName": "Asia Pacific (Hong Kong)", "value": "ap-east-1"},
                {"displayName": "Asia Pacific (Mumbai)", "value": "ap-south-1"},
                {"displayName": "Asia Pacific (Osaka-Local)", "value": "ap-northeast-3	"},
                {"displayName": "Asia Pacific (Seoul)", "value": "ap-northeast-2"},
                {"displayName": "Asia Pacific (Singapore)", "value": "ap-southeast-1"},
                {"displayName": "Asia Pacific (Sydney)", "value": "ap-southeast-2"},
                {"displayName": "Asia Pacific (Tokyo)", "value": "ap-northeast-1"},
                {"displayName": "Canada (Central)", "value": "ca-central-1"},
                {"displayName": "China (Beijing)", "value": "cn-north-1"},
                {"displayName": "China (Ningxia)", "value": "cn-northwest-1"},
                {"displayName": "Europe (Frankfurt)", "value": "eu-central-1"},
                {"displayName": "Europe (Ireland)", "value": "eu-west-1"},
                {"displayName": "Europe (London)", "value": "eu-west-2"},
                {"displayName": "Europe (Milan)", "value": "eu-south-1"},
                {"displayName": "Europe (Paris)", "value": "eu-west-3"},
                {"displayName": "Europe (Stockholm)", "value": "eu-north-1"},
                {"displayName": "South America (São Paulo)", "value": "sa-east-1"},
                {"displayName": "Middle East (Bahrain)", "value": "me-south-1"}
            ]
        }, {
            displayName: 'TTL',
            description: 'Expiration time in seconds',
            type: 'number',
            defaultValue: 3600
        }
    ],
    async run(context, accessKey, secretKey, fileName, method, bucket, region, ttl) {
        const {meta} = context;
        const request = await context.util.models.request.getById(meta.requestId);
        if (method === 'auto') {
            method = request.method;
        }
        fileName = escape(fileName);
        const date = moment().utc().format("YMMDDTHHmmss") + "Z";
        const datepart = date.split("T")[0];
        const host = `${bucket}.s3.${region}.amazonaws.com`;
        const params = {
            "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
            "X-Amz-Credential":
                `${accessKey}%2F${datepart}%2F${region}%2Fs3%2Faws4_request`,
            "X-Amz-Date": date,
            "X-Amz-Expires": ttl,
            "X-Amz-SignedHeaders": "host",
        };

        const urlargs = Object.entries(params).map(([key, val]) => `${key}=${val}`).join('&');

        const canonical_request = `${method}\n/${fileName}\n${urlargs}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;

        let hash = sha256.create();
        hash.update(canonical_request);

        const canonical_request_sha256 = hash.hex();

        const string_to_sign =
            `AWS4-HMAC-SHA256\n${date}\n${datepart}/${region}/s3/aws4_request\n${canonical_request_sha256}`;


        const signingKey = sha256.hmac.digest(
            sha256.hmac.digest(
                sha256.hmac.digest(
                    sha256.hmac.digest("AWS4" + secretKey, datepart),
                    region),
                "s3"),
            "aws4_request"
        );

        params["X-Amz-Signature"] = sha256.hmac(signingKey, string_to_sign);

        return `https://${host}/${fileName}?` +
            Object.entries(params).map(([key, val]) => `${key}=${val}`).join('&');
    }
}];