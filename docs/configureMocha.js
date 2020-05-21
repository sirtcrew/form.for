mocha.setup({
    ui: 'bdd',
    globals: ["signalR", "HealthService", "$", "jQuery", "Popper", "JSZip", "__core-js_shared__", "pdfMake", "createPdf", "SearchIndex", "moment",
        "Bloodhound", "Handlebars", "txt", "script*", "AxiosMockAdapter", "debug", "HandlebarsPrecompiled", "Base", "Alpaca", "async", "equiv",
        "formDefinitions", "observable", "_LRLogger", "_LRLogger", "_lr_loaded", "Msal", "openedWindows", "activeRenewals", "renewStates", "callbackMappedToRenewStates", "promiseMappedToRenewStates", "msal", "requestType"
    ],
    timeout: 10000
})
chai.use(chaiAsPromised)