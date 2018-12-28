/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module Client
 */

import { GRAPH_API_VERSION, GRAPH_BASE_URL } from "./Constants";
import { CustomAuthenticationProvider } from "./CustomAuthenticationProvider";
import { GraphRequest } from "./GraphRequest";
import { HTTPClientFactory } from "./HTTPClientFactory";
import { HTTPClient } from "./HTTPClient";
import { ClientOptions } from "./IClientOptions";
import { Options } from "./IOptions";
import { validatePolyFilling } from "./ValidatePolyFilling";

export class Client {

    /**
     * @private
     * A member which stores the Client instance options
     */
    private config: ClientOptions = {
        baseUrl: GRAPH_BASE_URL,
        debugLogging: false,
        defaultVersion: GRAPH_API_VERSION
    };

    /**
     * @private
     * A member which holds the HTTPClient instance
     */
    private httpClient: HTTPClient;

    /**
     * @constructor
     * Creates an instance of Client
     * @param {ClientOptions} clientOptions - The options to instantiate the client object 
     */
    constructor(clientOptions: ClientOptions) {
        try {
            validatePolyFilling();
        } catch (error) {
            throw error;
        }
        let self = this;
        for (const key in clientOptions) {
            self.config[key] = clientOptions[key];
        }
        let httpClient: HTTPClient;
        if (clientOptions.authProvider !== undefined) {
            httpClient = HTTPClientFactory.createWithAuthenticationProvider(clientOptions.authProvider);
        } else if (clientOptions.middleware !== undefined) {
            httpClient = new HTTPClient(clientOptions.middleware);
        } else {
            let error = new Error();
            error.name = "InvalidMiddlewareChain";
            error.message = "Unable to Create Client, Please provide either authentication provider for default middleware chain or custom middleware chain";
            throw error;
        }
        self.httpClient = httpClient;
    }

    /**
     * @public
     * @static
     * To create a client instance with options and initializes the default middleware chain
     * @param {Options} options - The options for client instance
     * @returns The Client instance
     */
    public static init(options: Options): Client {
        let clientOptions: ClientOptions = {};
        for (const i in options) {
            if (i === "authProvider") {
                clientOptions[i] = new CustomAuthenticationProvider(options[i]);
            } else if (i === "fetchOptions") {
                clientOptions.middlewareOptions = {
                    requestOptions: options.fetchOptions
                };
            } else {
                clientOptions[i] = options[i];
            }
        }
        return new Client(clientOptions);
    }

    /**
     * @public
     * Entry point to make requests
     * @param {string} path - The path string value
     * @returns The graph request instance
     */
    public api(path: string): GraphRequest {
        let self = this;
        return new GraphRequest(self.httpClient, self.config, path);
    }
}