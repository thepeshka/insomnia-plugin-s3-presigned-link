const {S3LinkBuilder} = require('../s3');

module.exports = {
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
                {"displayName": "US East (Ohio) us-east-2", "value": "us-east-2"},
                {"displayName": "US East (N. Virginia) us-east-1", "value": "us-east-1"},
                {"displayName": "US West (N. California) us-west-1", "value": "us-west-1"},
                {"displayName": "US West (Oregon) us-west-2", "value": "us-west-2"},
                {"displayName": "Africa (Cape Town) af-south-1", "value": "af-south-1"},
                {"displayName": "Asia Pacific (Hong Kong) ap-east-1", "value": "ap-east-1"},
                {"displayName": "Asia Pacific (Mumbai) ap-south-1", "value": "ap-south-1"},
                {"displayName": "Asia Pacific (Osaka-Local) ap-northeast-3", "value": "ap-northeast-3"},
                {"displayName": "Asia Pacific (Seoul) ap-northeast-2", "value": "ap-northeast-2"},
                {"displayName": "Asia Pacific (Singapore) ap-southeast-1", "value": "ap-southeast-1"},
                {"displayName": "Asia Pacific (Sydney ap-southeast-2)", "value": "ap-southeast-2"},
                {"displayName": "Asia Pacific (Tokyo) ap-northeast-1", "value": "ap-northeast-1"},
                {"displayName": "Canada (Central) ca-central-1", "value": "ca-central-1"},
                {"displayName": "China (Beijing) cn-north-1", "value": "cn-north-1"},
                {"displayName": "China (Ningxia) cn-northwest-1", "value": "cn-northwest-1"},
                {"displayName": "Europe (Frankfurt) eu-central-1", "value": "eu-central-1"},
                {"displayName": "Europe (Ireland) eu-west-1", "value": "eu-west-1"},
                {"displayName": "Europe (London) eu-west-2", "value": "eu-west-2"},
                {"displayName": "Europe (Milan) eu-south-1", "value": "eu-south-1"},
                {"displayName": "Europe (Paris) eu-west-3", "value": "eu-west-3"},
                {"displayName": "Europe (Stockholm) eu-north-1", "value": "eu-north-1"},
                {"displayName": "South America (São Paulo) sa-east-1", "value": "sa-east-1"},
                {"displayName": "Middle East (Bahrain) me-south-1", "value": "me-south-1"}
            ]
        }, {
            displayName: 'TTL',
            description: 'Expiration time in seconds',
            type: 'number',
            defaultValue: 3600
        }, {
            displayName: 'ACL',
            description: 'Canned ACL',
            type: 'enum',
            defaultValue: "none",
            options: [
                {"displayName": "None", "value": "none"},
                {"displayName": "private", "value": "private"},
                {"displayName": "public-read", "value": "public-read"},
                {"displayName": "public-read-write", "value": "public-read-write"},
                {"displayName": "aws-exec-read", "value": "aws-exec-read"},
                {"displayName": "authenticated-read", "value": "authenticated-read"},
                {"displayName": "bucket-owner-read", "value": "bucket-owner-read"},
                {"displayName": "bucket-owner-full-control", "value": "bucket-owner-full-control"},
                {"displayName": "long-delivery-write", "value": "long-delivery-write"},
            ]
        }, {
            displayName: 'Signed headers',
            description: 'Headers to sign (comma-separated)',
            type: 'string',
            defaultValue: ''
        }, {
            displayName: 'Signed parameters',
            description: 'Parameters to sign (comma-separated)',
            type: 'string',
            defaultValue: ''
        }
    ],
    async run(context, accessKey, secretKey, fileName, method, bucket, region, ttl, acl, headersList, paramsList) {
        const {meta} = context;
        const request = await context.util.models.request.getById(meta.requestId);
        if (method === 'auto') {
            method = request.method;
        }
        const headers = {};

        if (headersList)
            headersList.split(',').forEach((headerName) => {
                headerName = headerName.trim();
                const header = request.headers.find(({name}) => name === headerName);
                if (header)
                    headers[headerName] = header.value;
            });

        const params = {};

        if (paramsList)
            paramsList.split(',').forEach((paramName) => {
                paramName = paramName.trim();
                const parameter = request.parameters.find(({name}) => name === paramName);
                if (parameter)
                    params[paramName] = parameter.value;
            });

        return new S3LinkBuilder(method, region, bucket, fileName, accessKey, secretKey)
          .getSignedLink(acl === "none" ? null : acl, headers, params, ttl);
    }
};
