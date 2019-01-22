import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
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
  loading: any;
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
  timeNow: any;
  hourNow: any;
  minuteNow: any;
  momentNow: any;

  constructor(public nav: NavController, public alertCtrl: AlertController, public RestService:RestService, public loadingCtrl: LoadingController,
    public navParams: NavParams) {

    this.recId = navParams.get('recId');
    this.curRec = RestService.results[this.recId];
    var self = this;
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    this.momentNow = moment(new Date());
    if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
      this.hourNow = this.momentNow.tz(this.userTimezone).format('HH');
      this.minuteNow = this.momentNow.tz(this.userTimezone).format('mm');
      this.timeNow = this.momentNow.tz(this.userTimezone).format('HH:mm');
    } else {
      this.hourNow = this.momentNow.format('HH');
      this.minuteNow = this.momentNow.format('mm');
      this.timeNow = this.momentNow.format('HH:mm');
    }
    this.RestService.curProfileObj(function (error, results) {
      if (!error) {
        self.userTimezone = results.timezone;
      }
    });

    if (this.recId !== undefined) {
      this.card_form = new FormGroup({
        recordid: new FormControl(this.curRec.recordid),
        symptom: new FormControl(this.curRec.symptomname, Validators.required),
        symptomdescription: new FormControl(this.curRec.symptomdescription),
        dateofmeasure: new FormControl(this.formatDateTimeSaved(this.curRec.dateofmeasure)),
        enddate: new FormControl(this.formatDateTime(this.curRec.enddate)),
        endtime: new FormControl(this.formatTime(this.curRec.enddate)),
        profileid: new FormControl(this.curRec.profileid),
        userid: new FormControl(this.RestService.userId)
      });
    } else {
      this.newRec = true;
      this.card_form = new FormGroup({
        recordid: new FormControl(),
        symptom: new FormControl(null, Validators.required),
        symptomdescription: new FormControl(),
        dateofmeasure: new FormControl(),
        starttime: new FormControl(),
        enddate: new FormControl(),
        endtime: new FormControl(),
        profileid: new FormControl(),
        userid: new FormControl()
      });
    }
  }

  ionViewWillEnter() {
    this.nav.getPrevious().data.refresh = false;
  }

  deleteRecord(){
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    var self = this;

    if (dtNow < dtExpiration) {
      this.presentLoadingDefault();
      this.deleteRecordDo();
    } else {
      this.presentLoadingDefault();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from ' + self.formName + '.deleteRecord');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From ' + self.formName + '.deleteRecord - Credentials refreshed!');
          self.deleteRecordDo();
        }
      });
    }
  }

  deleteRecordDo(){
    let alert = this.alertCtrl.create({
      title: 'Confirm Delete',
      message: 'Do you certain you want to delete this record?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.loading.dismiss();
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Delete',
          handler: () => {
            console.log('Delete clicked');
              this.saving = true;
              this.formSave.recordid = this.card_form.get('recordid').value;
              this.formSave.profileid = this.RestService.currentProfile;
              this.formSave.userid = this.RestService.userId;
              this.formSave.active = 'N';
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
                self.loading.dismiss();
                self.nav.pop();
              }).catch( function(result){
                console.log('Error in formSymptom.delete: ',result);
                self.loading.dismiss();
              });
          }
        }
      ]
    });
    alert.present();
  }

  saveRecord(){
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    var self = this;

    if (dtNow < dtExpiration) {
      this.presentLoadingDefault();
      this.saveRecordDo();
    } else {
      this.presentLoadingDefault();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from ' + self.formName + '.saveRecord');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          console.log('From ' + self.formName + '.saveRecord - Credentials refreshed!');
          self.saveRecordDo();
        }
      });
    }
  }

  calculateDateTime() {
    var dtString;
    var offsetDate;
    var offset;
    var finalDate;
    var strDate;
    var strTime;
    //console.log('Date of Measure: ' + this.card_form.get('dateofmeasure').value);
    //console.log('Start Time: ' + this.card_form.get('starttime').value);
    if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
      strDate = this.momentNow.tz(this.userTimezone).format('YYYY-MM-DD');
      strTime = this.momentNow.tz(this.userTimezone).format('HH:mm');
    } else {
      strDate = this.momentNow.format('YYYY-MM-DD');
      strTime = this.momentNow.format('HH:mm');
    }
    if (this.card_form.get('dateofmeasure').dirty) {
      strDate = this.card_form.get('dateofmeasure').value;
    }
    if (this.card_form.get('starttime').dirty) {
      strTime = this.card_form.get('starttime').value;
    } else if (this.card_form.get('dateofmeasure').dirty) {
      strTime = '00:00';
    }
    dtString = strDate + ' ' + strTime;
    offsetDate = new Date(moment(dtString).toISOString());
    offset = offsetDate.getTimezoneOffset() / 60;
    if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
      finalDate = moment(dtString).tz(this.userTimezone).add(offset, 'hours').format('YYYY-MM-DD HH:mm');
      console.log('Final date with timezone: ' + finalDate);
    } else {
      finalDate = moment(dtString).add(offset, 'hours').format('YYYY-MM-DD HH:mm');
      console.log('Final date with no timezone: ' + finalDate);
    }
    return finalDate;
}

calculateEndDate() {
  var dtString;
  var offsetDate;
  var offset;
  var finalDate;
  var strDate;
  var strTime = '00:00';
  //console.log('Date of Measure: ' + this.card_form.get('dateofmeasure').value);
  //console.log('Start Time: ' + this.card_form.get('starttime').value);
  if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
    strDate = this.momentNow.tz(this.userTimezone).format('YYYY-MM-DD');
  } else {
    strDate = this.momentNow.format('YYYY-MM-DD');
  }
  if (this.card_form.get('enddate').dirty) {
    strDate = this.card_form.get('enddate').value;
  }
  if (this.card_form.get('endtime').dirty) {
    strTime = this.card_form.get('endtime').value;
  }
  dtString = strDate + ' ' + strTime;
  offsetDate = new Date(moment(dtString).toISOString());
  offset = offsetDate.getTimezoneOffset() / 60;
  if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
    finalDate = moment(dtString).tz(this.userTimezone).add(offset, 'hours').format('YYYY-MM-DD HH:mm');
    console.log('Final end date with timezone: ' + finalDate);
  } else {
    finalDate = moment(dtString).add(offset, 'hours').format('YYYY-MM-DD HH:mm');
    console.log('Final end date with no timezone: ' + finalDate);
  }
  return finalDate;
}

  saveRecordDo(){
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
      if (this.card_form.get('enddate').dirty && this.card_form.get('enddate').value !== null){
        this.formSave.enddate = this.calculateEndDate();
      }
    } else {
      this.formSave.symptomname = this.card_form.get('symptom').value;
      if (this.card_form.get('symptomdescription').dirty){
        this.formSave.symptomdescription = this.card_form.get('symptomdescription').value;
      }
      if (this.card_form.get('dateofmeasure').dirty || this.card_form.get('starttime').dirty){
        this.formSave.dateofmeasure = this.calculateDateTime();
      }
      if (this.card_form.get('enddate').dirty && this.card_form.get('enddate').value !== null){
        this.formSave.enddate = this.calculateEndDate();
      }
      this.formSave.profileid = this.RestService.currentProfile;
      this.formSave.userid = this.RestService.userId;
      this.formSave.active = 'Y';
    }
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
        console.log('Happy Path: ', self.RestService.results);
        self.category.title = "Measure";
        self.loading.dismiss();
        self.nav.pop();
      }).catch( function(result){
        console.log('Error from formSymptom.save: ',result);
        self.loading.dismiss();
      });
  }

  public today() {
    //Used as max day in date of measure control
    var momentNow;

    if (this.userTimezone !== undefined && this.userTimezone !== null && this.userTimezone !== "") {
      momentNow = this.momentNow.tz(this.userTimezone).format('YYYY-MM-DD');
    } else {
      momentNow = this.momentNow.format('YYYY-MM-DD');
    }
    //console.log('From Today momentNow: ' + momentNow);
    return momentNow;
  }

  hasEndDate() {
    if (this.card_form.get('enddate').value !== undefined && this.card_form.get('enddate').value !== null){
      return true;
    } else {
      return false;
    }
  }

  formatDateTimeTitle(dateString) {
    if (this.userTimezone !== undefined && this.userTimezone !=="") {
      return moment(dateString).tz(this.userTimezone).format('dddd, MMMM DD');
    } else {
      return moment(dateString).format('dddd, MMMM DD');
    }
  }

  formatDateTimeSaved(dateString) {
    if (dateString !== undefined && dateString !== null && dateString !== "") {
      if (this.userTimezone !== undefined && this.userTimezone !=="") {
        return moment(dateString).tz(this.userTimezone).format('MM-DD-YYYY hh:mm A');
      } else {
        return moment(dateString).format('MM-DD-YYYY hh:mm A');
      }
    } else {
      return null;
    }
  }

  formatDateTime(dateString) {
    if (dateString !== undefined && dateString !== null && dateString !== "") {
      if (this.userTimezone !== undefined && this.userTimezone !=="") {
        return moment(dateString).tz(this.userTimezone).format('YYYY-MM-DD');
      } else {
        return moment(dateString).format('YYYY-MM-DD');
      }
    } else {
      return null;
    }
  }

  formatTime(dateString) {
    if (dateString !== undefined && dateString !== null && dateString !== "") {
      if (this.userTimezone !== undefined && this.userTimezone !=="") {
        return moment(dateString).tz(this.userTimezone).format('hh:mm A');
      } else {
        return moment(dateString).format('hh:mm A');
      }
    } else {
      return null;
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
