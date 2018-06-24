/// <reference types="aws-sdk" />
import { Injectable } from '@angular/core';
import * as AWSme from 'aws-sdk';
import { AwsManagedPolicy } from 'aws-sdk/clients/organizations';
//import { AuthInfo } from 'aws-sdk/clients/iot';
var apigClientFactory = require('aws-api-gateway-client').default;
var profiles = [];
var results = [];
var cognitoIdentity;
var AuthData = {} as AuthData;
var currentProfile: number;

interface AccountProfile {
    profileid: number,
    accountid: number,
    firstname: string,
    lastname: string};

interface AuthData {
    key: string,
    email: string,
    cognitoId: string,
    accessKeyId: string, 
    expiration: Date,
    secretKey: string,
    sessionToken:string
};

@Injectable()

export class RestService {
    public AuthData: AuthData;
    public AWSRestFactory:any;
    public AWS: any;
    public CognitoIdentity: any;
    public Profiles: any;
    public results: any;
    public currentProfile: number = 0;

    constructor() {
        this.AWS = AWSme;
        this.AWSRestFactory = apigClientFactory;
        this.Profiles = profiles;
        this.results = results;
        this.AuthData = AuthData;
        this.CognitoIdentity = cognitoIdentity;
        this.currentProfile = currentProfile;
    }

    anyfunction() {
        console.log('testing');
    }

    getDataByProfile (page: string, profileid: number) {
        
    }

}    