import { Component } from '@angular/core';
import { NavController, AlertController, NavParams, LoadingController } from 'ionic-angular';
import { FeedModel } from '../feed/feed.model';
import 'rxjs/Rx';
import { ProcedureModel } from './listProcedure.model';
import { ProcedureService } from './listProcedure.service';
import { RestService } from '../../app/services/restService.service';
import { FormProcedure } from '../../pages/formProcedure/formProcedure';

var moment = require('moment-timezone');

@Component({
  selector: 'listExercisePage',
  templateUrl: 'listProcedure.html'
})
export class ListProcedure {
  list2: ProcedureModel = new ProcedureModel();
  feed: FeedModel = new FeedModel();
  formName: string = "listProcedure";
  loading: any;
  resultData: any;
  userTimezone: any;
  noData: boolean = false;

  constructor(
    public nav: NavController,
    public alertCtrl: AlertController,
    public list2Service: ProcedureService,
    public navParams: NavParams,
    public RestService:RestService,
    public loadingCtrl: LoadingController,
  ) {
    this.feed.category = navParams.get('category');

    var self = this;
    this.RestService.curProfileObj(function (error, results) {
      if (!error) {
        self.userTimezone = results.timezone;
      }
    });
  }

  ionViewWillEnter() {
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    //var dtExpiration = dtNow;  //for testing
    var self = this;

    if (dtNow < dtExpiration) {
      this.presentLoadingDefault();
      this.loadData();
    } else {
      this.presentLoadingDefault();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from listProcedure');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From listMedicalEvent - Credentials refreshed!');
          self.loadData();
        }
      });
    }
  }

  loadData() {
    var restURL: string;

    restURL="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/ProcedureByProfile";

    var config = {
      invokeUrl: restURL,
      accessKey: this.RestService.AuthData.accessKeyId,
      secretKey: this.RestService.AuthData.secretKey,
      sessionToken: this.RestService.AuthData.sessionToken,
      region:'us-east-1'
    };
    var apigClient = this.RestService.AWSRestFactory.newClient(config);
    var params = {
      //email: accountInfo.getEmail()
    };
    var pathTemplate = '';
    var method = 'GET';
    var additionalParams = {
        queryParams: {
            profileid: this.RestService.currentProfile
        }
    };
    var body = '';
    var self = this;

    apigClient.invokeApi(params, pathTemplate, method, additionalParams, body)
    .then(function(result){
      self.RestService.results = result.data;
      self.list2Service
      .getData()
      .then(data => {
        if (self.RestService.results !== undefined && self.RestService.results[0] !== undefined && self.RestService.results[0].recordid !== undefined &&
          self.RestService.results[0].recordid > 0) {
            self.list2.items = self.RestService.results;
            self.noData = false;
            console.log("Results Data for Get Procedures: ", self.list2.items);
        } else {
          self.noData = true;
          console.log('Results from listProcedure.loadData', self.RestService.results);
        }
        self.loading.dismiss();
      });
    }).catch( function(result){
        console.log(result);
        self.noData = true;
        self.loading.dismiss();
        alert('There was an error retrieving this data.  Please try again later');
    });
  }

  openRecord(recordId) {
    console.log("Goto Form index: " + recordId);
    //console.log("Recordid from index: " + this.list2[recordId].recordid);
    this.nav.push(FormProcedure, { recId: recordId });
    //alert('Open Record:' + recordId);
  }

  addNew() {
    this.nav.push(FormProcedure);
  }

  formatDateTime(dateString) {
    return moment.utc(dateString).format('MMM DD YYYY');
  }

  presentLoadingDefault() {
    this.loading = this.loadingCtrl.create({
    spinner: 'hide',
    content: `
      <div class="custom-spinner-container">
        <div class="custom-spinner-box">
           <img src="assets/images/stickManCursor3.gif" width="50" height="50" />
           Loading...
        </div>
      </div>`,
    });

    this.loading.present();

    setTimeout(() => {
      this.loading.dismiss();
      //console.log('Timeout for spinner called ' + this.formName);
    }, 15000);
  }

}
