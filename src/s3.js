const sha256 = require('js-sha256').sha256;
const moment = require('moment');

class S3LinkBuilder{
  constructor(method, region, bucket, key, awsAccessKeyId, awsSecretKey) {
    this.method = method;
    this.bucket = bucket;
    this.key = encodeURI(key);
    if (!this.key.startsWith('/')) this.key = '/' + this.key;
    this.region = region;
    this.awsAccessKeyId = awsAccessKeyId;
    this.awsSecretKey = awsSecretKey;
  }

  encodeHmacSha256(s, msg) {
    return sha256.hmac.digest(s, msg);
  }

  hexHmacSha256(s, msg) {
    return sha256.hmac(s, msg);
  }

  hexSha256(s) {
    let hash = sha256.create();
    hash.update(s);
    return hash.hex();
  }

  chainHmacSha256(...args){
    let h = args[0];
    args.slice(1).forEach((msg) => {
      h = this.encodeHmacSha256(h, msg);
    })
    return h;
  }

  getPublicLink(){
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com${this.key}`;
  }

  sortObject(o) {
    return Object.keys(o).sort().reduce(
      (obj, key) => {
        obj[key] = o[key];
        return obj;
      },
      {}
    );
  }

  getSignedLink(acl=null, headers={}, extra_params={}, expires=3600) {
    const date = moment().utc().format("YMMDDTHHmmss") + "Z";
    const datepart = date.split("T")[0];
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;

    headers.host = host;
    headers = this.sortObject(headers);
    const headersList = Object.keys(headers).join(';')

    const requestParams = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.awsAccessKeyId}%2F${datepart}%2F${this.region}%2Fs3%2Faws4_request`,
      "X-Amz-Date": date,
      "X-Amz-Expires": expires,
      "X-Amz-SignedHeaders": headersList.replace(/;/g, '%3B')
    }
    if (acl)
      requestParams['x-amz-acl'] = acl

    const paramsToSign = this.sortObject({
      ...requestParams,
      ...extra_params
    });


    const paramsStr = Object.entries(paramsToSign).map(([key, val]) => `${key}=${val}`).join('&');
    const headersStr = Object.entries(headers).map(([key, val]) => `${key}:${val}`).join('\n');
    const canonicalRequest =
      `${this.method}\n${this.key}\n${paramsStr}\n${headersStr}\n\n${headersList}\nUNSIGNED-PAYLOAD`;

    console.log(canonicalRequest);

    const stringToSign =
      `AWS4-HMAC-SHA256\n${date}\n${datepart}/${this.region}/s3/aws4_request\n${this.hexSha256(canonicalRequest)}`;
    console.log(stringToSign);

    const signingKey = this.chainHmacSha256("AWS4" + this.awsSecretKey, datepart, this.region, "s3", "aws4_request");
    requestParams["X-Amz-Signature"] = this.hexHmacSha256(signingKey, stringToSign);

    return `https://${host}${this.key}?` + Object.entries(requestParams).map(([key, val]) => `${key}=${val}`).join('&');
  }
}

module.exports = {
  S3LinkBuilder
};

