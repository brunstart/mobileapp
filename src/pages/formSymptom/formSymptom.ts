import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { Validators, FormGroup, FormControl, FormArray } from '@angular/forms';
import { RestService } from '../../app/services/restService.service';
import { ListMeasureModel, ListMeasure } from '../../pages/listMeasure/listMeasure.model';

import { HistoryItemModel } from '../../pages/history/history.model';
import { ListGoalsModel } from '../../pages/listGoals/listGoals.model';

var moment = require('moment-timezone');

@Component({
  selector: 'formExercise-page',
  templateUrl: 'formSymptom.html'
})
export class FormSymptomPage {
  section: string;
  formName: string = "formSymptom";
  recId: number;
  goalname: string;
  card_form: FormGroup;
  goal_array: FormArray;
  goal_schedule: FormGroup;
  curRec: any;
  newRec: boolean = false;
  saving: boolean = false;
  showTips: boolean = true;

  formModelSave: ListMeasureModel  = new ListMeasureModel();
  formSave: ListMeasure = new ListMeasure();
  category: HistoryItemModel = new HistoryItemModel();
  userTimezone: any;
  list2: ListGoalsModel = new ListGoalsModel();

  categories_checkbox_open: boolean;
  categories_checkbox_result;

  constructor(public nav: NavController, public alertCtrl: AlertController, public RestService:RestService,
    public navParams: NavParams) {
    this.recId = navParams.get('recId');
    this.curRec = RestService.results[this.recId];
    var self = this;
    //var dtNow = moment(new Date());
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);


   // console.log('Date Now from constructor: ' + dtNow.format('MMM-DD-YYYY hh:mm A'));
    this.RestService.curProfileObj(function (error, results) {
      if (!error) {
        self.userTimezone = results.timezone;
      }
    });
    if (this.recId !== undefined) {
      this.card_form = new FormGroup({
        recordid: new FormControl(this.curRec.recordid),
        symptom: new FormControl(this.curRec.symptomname),
        symptomdescription: new FormControl(this.curRec.symptomdescription),
        dateofmeasure: new FormControl(this.formatDateTime(this.curRec.dateofmeasure)),
        profileid: new FormControl(this.curRec.profileid),
        userid: new FormControl(this.RestService.userId)
      });
    } else {
      this.newRec = true;
      this.card_form = new FormGroup({
        recordid: new FormControl(),
        symptom: new FormControl(),
        symptomdescription: new FormControl(),
        dateofmeasure: new FormControl(localISOTime),
        profileid: new FormControl(),
        userid: new FormControl()
      });
    }
  }

  ionViewWillEnter() {
    this.nav.getPrevious().data.refresh = false;
  }

  deleteRecord(){
    let alert = this.alertCtrl.create({
      title: 'Confirm Delete',
      message: 'Do you certain you want to delete this record?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Delete',
          handler: () => {
            console.log('Delete clicked');

            var dtNow = moment(new Date());
            var dtExpiration = moment(this.RestService.AuthData.expiration);

            if (dtNow < dtExpiration) {
              this.saving = true;
              //alert('Going to delete');
              this.formSave.recordid = this.card_form.get('recordid').value;
              this.formSave.profileid = this.RestService.currentProfile;
              this.formSave.userid = this.RestService.userId;
              this.formSave.active = 'N';
              var restURL="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/TemperatureByProfile";

              var config = {
                invokeUrl: restURL,
                accessKey: this.RestService.AuthData.accessKeyId,
                secretKey: this.RestService.AuthData.secretKey,
                sessionToken: this.RestService.AuthData.sessionToken,
                region:'us-east-1'
              };

              var apigClient = this.RestService.AWSRestFactory.newClient(config);
              var params = {
                //pathParameters: this.vaccineSave
              };
              var pathTemplate = '';
              var method = 'POST';
              var additionalParams = {
                  queryParams: {
                      profileid: this.RestService.currentProfile,
                  }
              };
              var body = JSON.stringify(this.formSave);
              var self = this;

              console.log('Calling Post', this.formSave);
              apigClient.invokeApi(params, pathTemplate, method, additionalParams, body)
              .then(function(result){
                self.RestService.results = result.data;
                console.log('Happy Path: ' + self.RestService.results);
                self.category.title = "Measure";
                self.nav.pop();
              }).catch( function(result){
                console.log('Result: ',result);
                console.log(body);
              });
            } else {
              console.log('Need to login again!!! - Credentials expired from formMood - Delete');
              this.RestService.appRestart();
            }
          }
        }
      ]
    });
    alert.present();
  }

  saveRecord(){
    this.saving = true;
    if (this.card_form.get('recordid').value !==undefined && this.card_form.get('recordid').value !==null) {
      this.formSave.recordid = this.card_form.get('recordid').value;
      this.formSave.profileid = this.RestService.currentProfile;
      this.formSave.userid = this.RestService.userId;
      this.formSave.active = 'Y';
      if (this.card_form.get('symptom').dirty){
        this.formSave.symptomname = this.card_form.get('symptom').value;
      }
      if (this.card_form.get('symptomdescription').dirty){
        this.formSave.symptomdescription = this.card_form.get('symptomdescription').value;
      }
      if (this.card_form.get('dateofmeasure').dirty){
        this.formSave.dateofmeasure = this.card_form.get('dateofmeasure').value;
      }
    } else {
      this.formSave.symptomname = this.card_form.get('symptom').value;
      if (this.card_form.get('symptomdescription').dirty){
        this.formSave.symptomdescription = this.card_form.get('symptomdescription').value;
      }
      if (this.card_form.get('dateofmeasure').dirty){
        this.formSave.dateofmeasure = this.card_form.get('dateofmeasure').value;
      }
      this.formSave.profileid = this.RestService.currentProfile;
      this.formSave.userid = this.RestService.userId;
      this.formSave.active = 'Y';
    }

    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);

    if (dtNow < dtExpiration) {
      var restURL="https://ap6oiuyew6.execute-api.us-east-1.amazonaws.com/dev/SymptomByProfile";

      var config = {
        invokeUrl: restURL,
        accessKey: this.RestService.AuthData.accessKeyId,
        secretKey: this.RestService.AuthData.secretKey,
        sessionToken: this.RestService.AuthData.sessionToken,
        region:'us-east-1'
      };

      var apigClient = this.RestService.AWSRestFactory.newClient(config);
      var params = {
        //pathParameters: this.vaccineSave
      };
      var pathTemplate = '';
      var method = 'POST';
      var additionalParams = {
          queryParams: {
              profileid: this.RestService.currentProfile
          }
      };
      var body = JSON.stringify(this.formSave);
      var self = this;

      console.log('Calling Post', this.formSave);
      apigClient.invokeApi(params, pathTemplate, method, additionalParams, body)
      .then(function(result){
        self.RestService.results = result.data;
        console.log('Happy Path: ' + self.RestService.results);
        self.category.title = "Measure";
        self.nav.pop();
      }).catch( function(result){
        console.log('Result: ',result);
        console.log(body);
      });
    } else {
      console.log('Need to login again!!! - Credentials expired from listTemperature');
      this.RestService.appRestart();
    }
  }

  public today() {
    return new Date().toISOString().substring(0,10);
  }

  formatDateTime(dateString) {
    //alert('FormatDateTime called');
    if (this.userTimezone !== undefined && this.userTimezone !=="") {
      return moment(dateString).tz(this.userTimezone).format('MM-DD-YYYY hh:mm A');
    } else {
      return moment(dateString).format('MM-DD-YYYY hh:mm a');
    }
  }

  async ionViewCanLeave() {
    if (!this.saving && this.card_form.dirty) {
      const shouldLeave = await this.confirmLeave();
      return shouldLeave;
    }
  }

  confirmLeave(): Promise<Boolean> {
    let resolveLeaving;
    const canLeave = new Promise<Boolean>(resolve => resolveLeaving = resolve);
    const alert = this.alertCtrl.create({
      title: 'Exit without Saving',
      message: 'Do you want to exit without saving?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => resolveLeaving(false)
        },
        {
          text: 'Yes',
          handler: () => resolveLeaving(true)
        }
      ]
    });
    alert.present();
    return canLeave
  }

}
