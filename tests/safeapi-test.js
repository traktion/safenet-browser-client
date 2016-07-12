var injector = angular.injector(['SafeAPI', 'ng']);
var commandFactory = injector.get('CommandFactory');
var client = injector.get('Client');


var authenticateProperties = {
    'app': {
        'name': 'LazyDogBlog',
        'version': '0.1',
        'vendor': 'traktion',
        'id': 'traktion.safenet'
    },
    'permissions': ['SAFE_DRIVE_ACCESS']
};
var authenticateCommand = commandFactory.build('CreateAuthToken', authenticateProperties);

var getDirectoryProperties = {
    'path': "/",
    'isPathShared': 'true'
};
var getDirectoryCommand = commandFactory.build('FetchDirectory', getDirectoryProperties);


var promise = client.execute(authenticateCommand);
promise.then(function(response) {
    console.log("Authenticated! "+response);
    return client.execute(getDirectoryCommand);
}, function(reason) {
    console.log("Authentication failed! "+reason);
}).then(function(response) {
    console.log("Fetched directory! "+angular.toJson(response));
}, function(reason) {
    console.log("Fetch directory failed! "+reason);
});
