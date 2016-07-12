# safenet-browser-client
Client library for accessing the Safe Net Launcher REST API via a web browser

## Notes

1. This API uses the AngularJS libraries.
2. The command pattern is used to allow the developer to prepare one or more commands via the command factory.
3. Commands are executed via the client and promises can be used to sequence one or more dependant commands.
4. Examples of usage are included in the repo. Dependencies will need to be included for these to function.
5. This is very much work in progress. There has been little consideration for performance or validation via testing.