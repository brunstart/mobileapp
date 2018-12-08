import { Component } from '@angular/core';
import { NavController, AlertController, NavParams, LoadingController } from 'ionic-angular';
import { FeedModel } from '../feed/feed.model';
import 'rxjs/Rx';
import { ListContactModel } from './listContacts.model';
import { ListContactService } from './listContacts.service';
import { RestService } from '../../app/services/restService.service';
import { FormFindContact } from '../../pages/formFindContact/formFindContact';
import { FormContactPage } from '../../pages/formContact/formContact';
import { FormCallNotesPage } from '../../pages/formCallNotes/formCallNotes';
import { CallNumber } from '@ionic-native/call-number';
import { FormVisitPage } from '../../pages/formVisit/formVisit';

var moment = require('moment-timezone');

@Component({
  selector: 'listExercisePage',
  templateUrl: 'listContacts.html'
})
export class ListContactPage {
  list2: ListContactModel = new ListContactModel();
  feed: FeedModel = new FeedModel();
  loading: any;
  resultData: any;
  userTimezone: any;

  constructor(
    public nav: NavController,
    public alertCtrl: AlertController,
    public list2Service: ListContactService,
    public navParams: NavParams,
    public RestService:RestService,
    public loadingCtrl: LoadingController,
    private callNumber: CallNumber
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
    var self = this;

    if (dtNow < dtExpiration) {
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      this.loadData();
    } else {
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from listContacts');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From listContacts - Credentials refreshed!');
          self.loadData();
        }
      });
    }
  }

  loadData() {
    var restURL: string;

    restURL="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/ContactByProfile";

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
        self.list2.items = self.RestService.results;
        console.log("Results Data for Get ContactByProfile: ", self.list2.items);
        self.loading.dismiss();
      });
    }).catch( function(result){
        console.log(body);
        self.loading.dismiss();
    });
  }

  openRecord(recordId) {
    console.log("Goto Form index: " + recordId);
    //console.log("Recordid from index: " + this.list2[recordId].recordid);
    this.nav.push(FormContactPage, { recId: recordId });
    //alert('Open Record:' + recordId);
  }

  scheduleVisit(index) {
    var contact = this.RestService.results[index];
    this.nav.push(FormVisitPage, { contact: contact });
  }

  callDoc(phoneNum, recordId) {
    //console.log("Call Doc item", recordId);
    var contact = this.RestService.results[recordId];
    this.callNumber.callNumber(phoneNum, true)
      .then(() =>
        this.nav.push(FormCallNotesPage, { contact: contact, fromVisit: false })
      )
      .catch(() =>
        this.nav.push(FormCallNotesPage, { contact: contact, fromVisit: false })
      );
  }

  addNew() {
    this.nav.push(FormFindContact);
  }

  formatDateTime(dateString) {
    //alert('FormatDateTime called');
    if (this.userTimezone !== undefined && this.userTimezone !=="") {
      return moment(dateString).tz(this.userTimezone).format('dddd, MMMM DD');
    } else {
      return moment(dateString).format('dddd, MMMM DD');
    }
  }

  formatPhone(phoneNum) {
    var strPhone = String(phoneNum);
    strPhone = '(' + strPhone.substring(0, 3) + ')' + strPhone.substring(3, 6) + '-' + strPhone.substring(6, 10);
    return strPhone;
  }

  formatTime(timeString) {
    //alert('FormatDateTime called');
    var timeSplit = timeString.split(":");
    var hour = timeSplit[0];
    var minute = timeSplit[1];

    if (Number(hour) > 11) {
      if (Number(hour) == 12 ) {
        return hour + ":" + minute + " PM";
      } else {
        return (Number(hour) - 12) + ":" + minute + " PM";
      }
    } else {
      if (Number(hour) == 0) {
        return "12:" + minute + " AM";
      } else {
        return hour + ":" + minute + " AM";
      }
    }
  }
}