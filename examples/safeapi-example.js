angular.module('SafeAPIExample', ['ngRoute', 'ngCookies', 'ng'])

    .controller('SafeAPIController', ['$scope', '$cookies', function($scope, $cookies) {
        $scope.output = "";
        $scope.createFileTarget = "/paste/sample.html";
        $scope.removeFileTarget = "/paste/sample.html";
        $scope.fetchFileTarget = "/paste/sample.html";
        $scope.updateFileTarget = "";
        $scope.updateFileContent = "";

        var _arrayBufferToString = function(buffer) {
            var output = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                output += String.fromCharCode(bytes[i]);
            }
            return output;
        };

        var _arrayBufferToBase64 = function(buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        };

        var _base64ToArrayBuffer = function(string_base64)    {
            var binary_string =  window.atob(string_base64);
            var len = binary_string.length;
            var bytes = new Uint8Array( len );
            for (var i = 0; i < len; i++)        {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        };
        
        var loadCookies = function() {
            var injector = angular.injector(['SafeAPI', 'ng']);
            var CommandParameters = injector.get('CommandParameters');

            var safeAPICookie = angular.fromJson($cookies.get('safeAPI'));
            if (safeAPICookie != undefined) {
                if ('token' in safeAPICookie) {
                    CommandParameters.token = safeAPICookie['token'];
                }
                if ('symmetricKey' in safeAPICookie) {
                    CommandParameters.symmetricKey = new Uint8Array(_base64ToArrayBuffer(safeAPICookie['symmetricKey']));
                }
                if ('symmetricNonce' in safeAPICookie) {
                    CommandParameters.symmetricNonce = new Uint8Array(_base64ToArrayBuffer(safeAPICookie['symmetricNonce']));
                }
                if ('permissions' in safeAPICookie) {
                    CommandParameters.permissions = safeAPICookie['permissions'];
                }
            }
        };

        var saveCookies = function() {
            var injector = angular.injector(['SafeAPI', 'ng']);
            var CommandParameters = injector.get('CommandParameters');

            var safeAPICookie = {
                'token': CommandParameters.token,
                'symmetricKey': _arrayBufferToBase64(CommandParameters.symmetricKey),
                'symmetricNonce': _arrayBufferToBase64(CommandParameters.symmetricNonce),
                'permissions': CommandParameters.permissions
            };
            $cookies.put('safeAPI', angular.toJson(safeAPICookie));
        };

        $scope.createAuthToken = function() {
            loadCookies();
            
            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'app': {
                    'name': 'ExampleApp',
                    'version': '0.1',
                    'vendor': 'example',
                    'id': 'example.safenet'
                },
                'permissions': ['SAFE_DRIVE_ACCESS']
            };
            var createAuthTokenCommand = commandFactory.build('CreateAuthToken', properties);

            var promise = client.execute(createAuthTokenCommand);
            promise.then(function(response) {
                console.log("Created Auth Token! "+response);
                $scope.output = response;
                saveCookies();
            }, function(reason) {
                console.log("Create Auth Token Failed! "+reason);
            });
        };

        $scope.checkAuthToken = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var checkAuthTokenCommand = commandFactory.build('CheckAuthToken', {});

            var promise = client.execute(checkAuthTokenCommand);
            promise.then(function(response) {
                console.log("Checked Auth Token! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Check Auth Token Failed! "+reason);
            });
        };

        $scope.removeAuthToken = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var removeAuthTokenCommand = commandFactory.build('RemoveAuthToken', {});

            var promise = client.execute(removeAuthTokenCommand);
            promise.then(function(response) {
                console.log("Removed Auth Token! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Remove Auth Token Failed! "+reason);
            });
        };

        $scope.createDirectory = function(dirPath) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'dirPath': dirPath,
                'isPrivate': false,
                'metadata': null,
                'isVersioned': false,
                'isPathShared': true
            };
            var createDirectoryCommand = commandFactory.build('CreateDirectory', properties);

            var promise = client.execute(createDirectoryCommand);
            promise.then(function(response) {
                console.log("Created Directory! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Create Directory Failed! "+reason);
            });
        };

        $scope.fetchDirectory = function(dirPath) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');
            
            var properties = {
                'dirPath': dirPath,
                'isPathShared': true
            };
            var fetchDirectoryCommand = commandFactory.build('FetchDirectory', properties);

            var promise = client.execute(fetchDirectoryCommand);
            promise.then(function(response) {
                console.log("Fetched Directory! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Fetch Directory Failed! "+reason);
            });
        };

        $scope.removeDirectory = function(dirPath) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'dirPath': dirPath,
                'isPathShared': true
            };
            var removeDirectoryCommand = commandFactory.build('RemoveDirectory', properties);

            var promise = client.execute(removeDirectoryCommand);
            promise.then(function(response) {
                console.log("Removed Directory! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Remove Directory Failed! "+reason);
            });
        };

        $scope.createFile = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            if ($scope.createFileTarget == 'hash') $scope.createFileTarget = sha224(new Date().getTime().toString());

            var properties = {
                'filePath': $scope.createFileTarget,
                'isPrivate': false,
                'metadata': null,
                'isVersioned': false,
                'isPathShared': true
            };
            var createFileCommand = commandFactory.build('CreateFile', properties);

            var promise = client.execute(createFileCommand);
            promise.then(function(response) {
                console.log("Created File! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Create File Failed! "+reason);
            });
        };

        $scope.fetchFile = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'filePath': $scope.fetchFileTarget,
                'isPathShared': true
            };
            var fetchFileCommand = commandFactory.build('FetchFile', properties);

            var promise = client.execute(fetchFileCommand);
            promise.then(function(response) {
                console.log("Fetched File! "+response);
                $scope.updateFileContent = response;
                $scope.updateFileTarget = $scope.fetchFileTarget
            }, function(reason) {
                console.log("Fetch File Failed! "+reason);
            });
        };

        $scope.updateFile = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'filePath': $scope.updateFileTarget,
                'isPathShared': true,
                'offset': 0,
                'data': $scope.updateFileContent
            };
            var updateFileCommand = commandFactory.build('UpdateFile', properties);

            var promise = client.execute(updateFileCommand);
            promise.then(function(response) {
                console.log("Updated File! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Update File Failed! "+reason);
            });
        };

        $scope.removeFile = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'filePath': $scope.removeFileTarget,
                'isPathShared': true
            };
            var removeFileCommand = commandFactory.build('RemoveFile', properties);

            var promise = client.execute(removeFileCommand);
            promise.then(function(response) {
                console.log("Removed File! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Remove File Failed! "+reason);
            });
        };

        $scope.createDNSName = function(longName) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'longName': longName
            };
            var createDNSNameCommand = commandFactory.build('CreateDNSName', properties);

            var promise = client.execute(createDNSNameCommand);
            promise.then(function(response) {
                console.log("Created DNS Name! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Create DNS Name Failed! "+reason);
            });
        };

        $scope.fetchDNSNames = function() {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var fetchDNSNamesCommand = commandFactory.build('FetchDNSNames', {});

            var promise = client.execute(fetchDNSNamesCommand);
            promise.then(function(response) {
                console.log("Fetched DNS Name! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Fetch DNS Name Failed! "+reason);
            });
        };

        $scope.createService = function(longName, serviceName, serviceHomeDirPath) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'longName': longName,
                'serviceName': serviceName,
                'serviceHomeDirPath': serviceHomeDirPath,
                'isPathShared': true
            };
            var createServiceCommand = commandFactory.build('CreateService', properties);

            var promise = client.execute(createServiceCommand);
            promise.then(function(response) {
                console.log("Created Service! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Create Service Failed! "+reason);
            });
        };
        
        $scope.fetchServices = function(longName) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'longName': longName
            };
            var fetchServicesCommand = commandFactory.build('FetchServices', properties);

            var promise = client.execute(fetchServicesCommand);
            promise.then(function(response) {
                console.log("Fetched Services! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Fetch Services Failed! "+reason);
            });
        };
        
        $scope.fetchServiceDirectory = function(serviceName, longName) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'serviceName': serviceName,
                'longName': longName
            };
            var fetchServiceDirectoryCommand = commandFactory.build('FetchServiceDirectory', properties);

            var promise = client.execute(fetchServiceDirectoryCommand);
            promise.then(function(response) {
                console.log("Fetched Service Directory! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Fetch Service Directory Failed! "+reason);
            });
        };

        $scope.fetchServiceFile = function(serviceName, longName, filePath) {
            loadCookies();

            var injector = angular.injector(['SafeAPI', 'ng']);
            var commandFactory = injector.get('CommandFactory');
            var client = injector.get('Client');

            var properties = {
                'serviceName': serviceName,
                'longName': longName,
                'filePath': filePath
            };
            var fetchServiceFileCommand = commandFactory.build('FetchServiceFile', properties);

            var promise = client.execute(fetchServiceFileCommand);
            promise.then(function(response) {
                console.log("Fetched Service File! "+response);
                $scope.output = response;
            }, function(reason) {
                console.log("Fetch Service File Failed! "+reason);
            });
        };
    }]);