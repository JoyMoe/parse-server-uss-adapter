'use strict';
// USSAdapter
// Store Parse Files in UPYUN Storage Service: https://www.upyun.com/products/file-storage
const upyun = require('upyun');

function requiredOrFromEnvironment(options, key, env) {
    options[key] = options[key] || process.env[env];
    if (!options[key]) {
        throw `USSAdapter requires an ${key}`;
    }
    return options;
}

function fromEnvironmentOrDefault(options, key, env, defaultValue) {
    options[key] = options[key] || process.env[env] || defaultValue;
    return options;
}

function optionsFromArguments(args) {
    let options = {};
    let serviceNameOrOptions = args[0];
    if (typeof serviceNameOrOptions == 'string') {
        options.serviceName = serviceNameOrOptions;
        options.operatorName = args[1];
        options.operatorPassword = args[2];
        let otherOptions = args[3];
        if (otherOptions) {
            options.bucketPrefix = otherOptions.bucketPrefix;
            options.directAccess = otherOptions.directAccess;
            options.baseUrl = otherOptions.baseUrl;
        }
    } else {
        options = Object.assign({}, serviceNameOrOptions);
    }
    options = requiredOrFromEnvironment(options, 'serviceName', 'USS_SERVICE_NAME');
    options = requiredOrFromEnvironment(options, 'operatorName', 'USS_OPERATOR_NAME');
    options = requiredOrFromEnvironment(options, 'operatorPassword', 'USS_OPERATOR_PASSWORD');
    options = fromEnvironmentOrDefault(options, 'bucketPrefix', 'USS_BUCKET_PREFIX', '');
    options = fromEnvironmentOrDefault(options, 'directAccess', 'USS_DIRECT_ACCESS', false);
    if (options.directAccess) {
        options = requiredOrFromEnvironment(options, 'baseUrl', 'USS_BASE_URL');
    }

    return options;
}

/*
supported options

*serviceName / 'USS_SERVICE_NAME'
*operatorName / 'USS_OPERATOR_NAME'
*operatorPassword / 'USS_OPERATOR_PASSWORD'
{ bucketPrefix / 'USS_BUCKET_PREFIX' defaults to ''
directAccess / 'USS_DIRECT_ACCESS' defaults to false
*baseUrl / 'USS_BASE_URL'
*/
function USSAdapter() {
    let options = optionsFromArguments(arguments);

    this._baseUrl = options.baseUrl;
    this._bucketPrefix = options.bucketPrefix;
    this._directAccess = options.directAccess;

    let service = new upyun.Service(options.serviceName, options.operatorName, options.operatorPassword);
    this._ussClient = new upyun.Client(service);
}

USSAdapter.prototype.createFile = function (filename, data, contentType) {
    return new Promise((resolve, reject) => {
        this._ussClient.putFile(this._bucketPrefix + filename, data).then(function () {
            resolve();
        }, function () {
            reject();
        });
    });
}

USSAdapter.prototype.deleteFile = function (filename) {
    return new Promise((resolve, reject) => {
        this._ussClient.deleteFile(this._bucketPrefix + filename).then(function () {
            resolve();
        }, function () {
            reject();
        });
    });
}

USSAdapter.prototype.getFileData = function (filename) {
    return new Promise((resolve, reject) => {
        this._ussClient.getFile(this._bucketPrefix + filename).then(function (result) {
            resolve(result);
        }, function () {
            reject();
        });
    });
}

USSAdapter.prototype.getFileLocation = function (config, filename) {
    if (this._directAccess) {
        return `${this._baseUrl}/${this._bucketPrefix + filename}`;
    }
    return (config.mount + '/files/' + config.applicationId + '/' + encodeURIComponent(filename));
}

module.exports = USSAdapter;
module.exports.default = USSAdapter;