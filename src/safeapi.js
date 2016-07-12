angular.module('SafeAPI', ['ng'])


    .value('CommandParameters', {
        'host': 'http://safeapi.safenet',
        'token': null,
        'symmetricKey': null,
        'symmetricNonce': null
    })


    .service('CommandFactory', ['CommandParameters', function(commandParameters) {
        
        this.build = function(commandName, commandProperties) {
            switch (commandName) {
                case 'CreateAuthToken':
                    return buildCreateAuthTokenCommand(commandParameters, commandProperties);
                case 'CheckAuthToken':
                    return buildCheckAuthTokenCommand(commandParameters, commandProperties);
                case 'RemoveAuthToken':
                    return buildRemoveAuthTokenCommand(commandParameters, commandProperties);
                case 'CreateDirectory':
                    return buildCreateDirectoryCommand(commandParameters, commandProperties);
                case 'FetchDirectory':
                    return buildFetchDirectoryCommand(commandParameters, commandProperties);
                case 'RemoveDirectory':
                    return buildRemoveDirectoryCommand(commandParameters, commandProperties);
                case 'CreateFile':
                    return buildCreateFileCommand(commandParameters, commandProperties);
                case 'FetchFile':
                    return buildFetchFileCommand(commandParameters, commandProperties);
                case 'UpdateFile':
                    return buildUpdateFileCommand(commandParameters, commandProperties);
                case 'RemoveFile':
                    return buildRemoveFileCommand(commandParameters, commandProperties);
                case 'CreateDNSName':
                    return buildCreateDNSNameCommand(commandParameters, commandProperties);
                case 'FetchDNSNames':
                    return buildFetchDNSNamesCommand(commandParameters, commandProperties);
                case 'CreateService':
                    return buildCreateServiceCommand(commandParameters, commandProperties);
                case 'FetchServices':
                    return buildFetchServicesCommand(commandParameters, commandProperties);
                case 'FetchServiceDirectory':
                    return buildFetchServiceDirectoryCommand(commandParameters, commandProperties);
                case 'FetchServiceFile':
                    return buildFetchServiceFileCommand(commandParameters, commandProperties);
            }
        };

        var buildCreateAuthTokenCommand = function(commandParameters, commandProperties) {
            var CreateAuthTokenCommand = function CreateAuthTokenCommand() {};
            CreateAuthTokenCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            CreateAuthTokenCommand.prototype.getMethod = function() {
                return "POST";
            };

            CreateAuthTokenCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/auth";
            };

            CreateAuthTokenCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'application/json'}
            };

            CreateAuthTokenCommand.prototype.getData = function() {
                // Creating the authorisation request payload
                return {
                    app: commandProperties.app,
                    // Converting asymmetric public key to base64 string
                    publicKey: this._arrayBufferToBase64(this.asymmetricKeys.publicKey),
                    // Converting nonce to base64 string
                    nonce: this._arrayBufferToBase64(this.nonce),
                    // List of permissions requested
                    permissions: commandProperties.permissions
                };
            };

            CreateAuthTokenCommand.prototype.getCallback = function(response) {

                if (response.status !== 200) {
                    throw new Error('Failed with error code: ' + response.data.statusCode);
                }
                // The encrypted symmetric key received as base64 string is converted to Uint8Array
                var cipherText = new Uint8Array(this._base64ToArrayBuffer(response.data.encryptedKey));
                // The asymmetric public key of launcher recieved as base64 string is converted to Uint8Array
                var publicKey = new Uint8Array(this._base64ToArrayBuffer(response.data.publicKey));
                // the cipher message is decrypted using the asymmetric private key of application and the public key of launcher
                var data = sodium.crypto_box_open_easy(cipherText, this.nonce, publicKey, this.asymmetricKeys.privateKey);
                // The first segment of the data will have the symmetric key
                var symmetricKey = data.slice(0, sodium.crypto_secretbox_KEYBYTES);
                // The second segment of the data will have the nonce to be used
                var symmetricNonce = data.slice(sodium.crypto_secretbox_KEYBYTES);
                // Authorisation token
                var token = response.data.token;
                // List of permissions approved by the user
                var permissions = response.data.permissions;

                this.setSymmetricKey(symmetricKey);
                this.setSymmetricNonce(symmetricNonce);
                this.setToken(token);
                this.setPermissions(permissions);

                this.setResponse({
                    token: response.data.token,
                    permissions: response.data.permissions,
                    publicKey: response.data.publicKey,
                    encryptedKey: response.data.encryptedKey
                });
            };

            return new CreateAuthTokenCommand(commandParameters, commandProperties);
        };

        var buildCheckAuthTokenCommand = function(commandParameters, commandProperties) {

            var CheckAuthTokenCommand = function CheckAuthTokenCommand() {};
            CheckAuthTokenCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            CheckAuthTokenCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/auth";
            };

            CheckAuthTokenCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'application/json', 'Authorization': 'Bearer '+this.getToken()}
            };

            return new CheckAuthTokenCommand(commandParameters, commandProperties);
        };
        
        var buildRemoveAuthTokenCommand = function(commandParameters, commandProperties) {

            var RemoveAuthTokenCommand = function RemoveAuthTokenCommand() {};
            RemoveAuthTokenCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            RemoveAuthTokenCommand.prototype.getMethod = function() {
                return "DELETE";
            };

            RemoveAuthTokenCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/auth";
            };

            RemoveAuthTokenCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            return new RemoveAuthTokenCommand(commandParameters, commandProperties);
        };

        var buildCreateDirectoryCommand = function(commandParameters, commandProperties) {

            var CreateDirectoryCommand = function CreateDirectoryCommand() {};
            CreateDirectoryCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            CreateDirectoryCommand.prototype.getMethod = function() {
                return "POST";
            };

            CreateDirectoryCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/directory";
            };

            CreateDirectoryCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };
            
            CreateDirectoryCommand.prototype.getData = function() {
                return this.getEncryptedData(JSON.stringify(commandProperties));
            };

            return new CreateDirectoryCommand(commandParameters, commandProperties);
        };

        var buildFetchDirectoryCommand = function(commandParameters, commandProperties) {

            var FetchDirectoryCommand = function FetchDirectoryCommand() {};
            FetchDirectoryCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            FetchDirectoryCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/directory/"+encodeURIComponent(commandProperties.dirPath)+"/"+commandProperties.isPathShared;
            };

            FetchDirectoryCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            FetchDirectoryCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new FetchDirectoryCommand(commandParameters, commandProperties);
        };

        var buildRemoveDirectoryCommand = function(commandParameters, commandProperties) {

            var RemoveDirectoryCommand = function RemoveDirectoryCommand() {};
            RemoveDirectoryCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            RemoveDirectoryCommand.prototype.getMethod = function() {
                return "DELETE";
            };

            RemoveDirectoryCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/directory/"+encodeURIComponent(commandProperties.dirPath)+"/"+commandProperties.isPathShared;
            };

            RemoveDirectoryCommand.prototype.getHeaders = function() {
                return {'Authorization': 'Bearer '+this.getToken()}
            };

            RemoveDirectoryCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new RemoveDirectoryCommand(commandParameters, commandProperties);
        };

        var buildCreateFileCommand = function(commandParameters, commandProperties) {

            var CreateFileCommand = function CreateFileCommand() {};
            CreateFileCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            CreateFileCommand.prototype.getMethod = function() {
                return "POST";
            };

            CreateFileCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/file";
            };

            CreateFileCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'application/json', 'Authorization': 'Bearer '+this.getToken()}
            };

            CreateFileCommand.prototype.getData = function() {
                return this.getEncryptedData(JSON.stringify(commandProperties));
            };

            CreateFileCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new CreateFileCommand(commandParameters, commandProperties);
        };

        var buildFetchFileCommand = function(commandParameters, commandProperties) {

            var FetchFileCommand = function FetchFileCommand() {};
            FetchFileCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            FetchFileCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/file/"+encodeURIComponent(commandProperties.filePath)
                    +"/"+commandProperties.isPathShared;
            };

            FetchFileCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            FetchFileCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new FetchFileCommand(commandParameters, commandProperties);
        };

        var buildUpdateFileCommand = function(commandParameters, commandProperties) {

            var UpdateFileCommand = function UpdateFileCommand() {};
            UpdateFileCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            UpdateFileCommand.prototype.getMethod = function() {
                return "PUT";
            };

            UpdateFileCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/file/"+encodeURIComponent(commandProperties.filePath)
                    +"/"+commandProperties.isPathShared;
                // PG:TODO: adding offset causes 401 errors
            };

            UpdateFileCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            UpdateFileCommand.prototype.getData = function() {
                return this.getEncryptedData(commandProperties.data);
            };

            UpdateFileCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new UpdateFileCommand(commandParameters, commandProperties);
        };

        var buildRemoveFileCommand = function(commandParameters, commandProperties) {

            var RemoveFileCommand = function RemoveFileCommand() {};
            RemoveFileCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            RemoveFileCommand.prototype.getMethod = function() {
                return "DELETE";
            };

            RemoveFileCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/nfs/file/"+encodeURIComponent(commandProperties.filePath)+"/"+commandProperties.isPathShared;
            };

            RemoveFileCommand.prototype.getHeaders = function() {
                return {'Authorization': 'Bearer '+this.getToken()}
            };

            RemoveFileCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new RemoveFileCommand(commandParameters, commandProperties);
        };

        var buildCreateDNSNameCommand = function(commandParameters, commandProperties) {
            // TODO:PG: This fails with a 400 (CoreError:MutationFailure), even when authorized

            var CreateDNSNameCommand = function CreateDNSNameCommand() {};
            CreateDNSNameCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            CreateDNSNameCommand.prototype.getMethod = function() {
                return "POST";
            };

            CreateDNSNameCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/dns/"+encodeURIComponent(commandProperties.longName);
            };

            CreateDNSNameCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            CreateDNSNameCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new CreateDNSNameCommand(commandParameters, commandProperties);
        };

        var buildFetchDNSNamesCommand = function(commandParameters, commandProperties) {

            var FetchDNSNamesCommand = function FetchDNSNamesCommand() {};
            FetchDNSNamesCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            FetchDNSNamesCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/dns";
            };

            FetchDNSNamesCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            FetchDNSNamesCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new FetchDNSNamesCommand(commandParameters, commandProperties);
        };

        var buildCreateServiceCommand = function(commandParameters, commandProperties) {
            // TODO:PG: This fails with a 400, even when authorized
            // FIXED: Change from POST to PUT and it completes!

            var CreateServiceCommand = function CreateServiceCommand() {};
            CreateServiceCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            CreateServiceCommand.prototype.getMethod = function() {
                return "PUT";
            };

            CreateServiceCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/dns";
            };

            CreateServiceCommand.prototype.getHeaders = function() {
                return {'Content-Type': 'text/plain', 'Authorization': 'Bearer '+this.getToken()}
            };

            CreateServiceCommand.prototype.getData = function() {
                return this.getEncryptedData(JSON.stringify(commandProperties));
            };

            CreateServiceCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new CreateServiceCommand(commandParameters, commandProperties);
        };

        var buildFetchServicesCommand = function(commandParameters, commandProperties) {

            var FetchServicesCommand = function FetchServicesCommand() {};
            FetchServicesCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            FetchServicesCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/dns/"+encodeURIComponent(commandProperties.longName);
            };

            FetchServicesCommand.prototype.getHeaders = function() {
                return {'Authorization': 'Bearer '+this.getToken()}
            };

            FetchServicesCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new FetchServicesCommand(commandParameters, commandProperties);
        };

        var buildFetchServiceDirectoryCommand = function(commandParameters, commandProperties) {
            // TODO:PG: This fails with a 500

            var FetchServiceDirectoryCommand = function FetchServiceDirectoryCommand() {};
            FetchServiceDirectoryCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            FetchServiceDirectoryCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/dns/"+encodeURIComponent(commandProperties.serviceName)+"/"+encodeURIComponent(commandProperties.longName);
            };

            FetchServiceDirectoryCommand.prototype.getHeaders = function() {
                return {'Authorization': 'Bearer '+this.getToken()}
            };

            FetchServiceDirectoryCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new FetchServiceDirectoryCommand(commandParameters, commandProperties);
        };

        var buildFetchServiceFileCommand = function(commandParameters, commandProperties) {
            // TODO:PG: This fails with a 500

            var FetchServiceFileCommand = function FetchServiceFileCommand() {};
            FetchServiceFileCommand.prototype = new AbstractCommand(commandParameters, commandProperties);

            FetchServiceFileCommand.prototype.getURL = function() {
                return this.getHost()+"/0.4/dns/"+encodeURIComponent(commandProperties.serviceName)
                    +"/"+encodeURIComponent(commandProperties.longName)
                    +"/"+encodeURIComponent(commandProperties.filePath);
            };

            FetchServiceFileCommand.prototype.getHeaders = function() {
                return {'Authorization': 'Bearer '+this.getToken()}
            };

            FetchServiceFileCommand.prototype.getCallback = function(response) {
                return this.getDataCallback(response);
            };

            return new FetchServiceFileCommand(commandParameters, commandProperties);
        };
    }])


    .service('Client', ['$http', '$q', function($http, $q) {
    
        this.execute = function(command) {

            return $q(function(resolve, reject) {
                $http({
                    method: command.getMethod(),
                    url: command.getURL(),
                    headers: command.getHeaders(),
                    data: command.getData()
                }).then(function (response) {
                    command.getCallback(response);
                    resolve(command.getResponse());
                }, function errorCallback(response) {
                    command.getCallback(response);
                    reject(command.getResponse());
                });
            });
        }
    }]);


var AbstractCommand = function(commandParameters, commandProperties) {
    // PG:TODO: Only needed for auth? Shouldn't be needed here.
    // Generate Asymmetric Key pairs
    this.asymmetricKeys = sodium.crypto_box_keypair();
    // Generate random nonce
    this.nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    
    this.response = null;

    this._arrayBufferToString = function(buffer) {
        var output = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            output += String.fromCharCode(bytes[i]);
        }
        return output;
    };

    this._arrayBufferToBase64 = function(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    this._base64ToArrayBuffer = function(string_base64)    {
        var binary_string =  window.atob(string_base64);
        var len = binary_string.length;
        var bytes = new Uint8Array( len );
        for (var i = 0; i < len; i++)        {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    };

    this.getMethod = function() {
        return "GET";
    };

    this.getURL = function() {
        return commandParameters.host + "/0.4/";
    };

    this.getHeaders = function() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+commandParameters.token
        }
    };

    this.getData = function() {
        return '';
    };

    this.getDataCallback = function(response) {
        var encodedData = this._base64ToArrayBuffer(response.data);

        var data = this._arrayBufferToString(
            sodium.crypto_secretbox_open_easy(
                new Uint8Array(encodedData),
                this.getSymmetricNonce(),
                this.getSymmetricKey()
            )
        );

        this.setResponse(data);
        
        if (response.status === 400) {
            return console.log('Bad request');
        }
        if (response.status === 401) {
            return console.log('Unauthorised');
        }
    };

    this.getCallback = function(response) {
        this.setResponse('ok');

        if (response.status === 400) {
            return console.log('Bad request');
        }
        if (response.status === 401) {
            return console.log('Unauthorised');
        }
    };
    
    this.getEncryptedData = function(data) {
        // Encrypt the payload using the symmetricKey and symmetricNonce
        var encryptedData = sodium.crypto_secretbox_easy(data, this.getSymmetricNonce(), this.getSymmetricKey());
        return this._arrayBufferToBase64(new Uint8Array(encryptedData));
    };

    this.getHost = function() {
        return commandParameters.host;
    };

    this.setSymmetricKey = function(symmetricKey) {
        commandParameters.symmetricKey = symmetricKey;
    };

    this.getSymmetricKey = function() {
        return commandParameters.symmetricKey;
    };

    this.setSymmetricNonce = function(symmetricNonce) {
        commandParameters.symmetricNonce = symmetricNonce;
    };

    this.getSymmetricNonce = function() {
        return commandParameters.symmetricNonce;
    };

    this.setToken = function(token) {
        commandParameters.token = token;
    };

    this.getToken = function() {
        return commandParameters.token;
    };

    this.setPermissions = function(permissions) {
        commandParameters.permissions = permissions;
    };

    this.getPermissions = function() {
        return commandParameters.permissions;
    };

    this.setResponse = function(response) {
        this.response = response;
    };

    this.getResponse = function() {
        return this.response;
    };
};
