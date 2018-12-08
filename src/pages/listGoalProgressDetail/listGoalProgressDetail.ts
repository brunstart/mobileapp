import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { FeedModel } from '../feed/feed.model';
import 'rxjs/Rx';
import { ListGoalsModel, ListGoalWeeks } from '../../pages/listGoals/listGoals.model';
import { ListGoalsService } from '../../pages/listGoals/listGoals.service';
import { RestService } from '../../app/services/restService.service';
import { FormGoalsPage } from '../../pages/formGoals/formGoals';
import { FormExercisePage } from '../../pages/formExercise/formExercise';
import { FormTaskPage } from '../../pages/formTask/formTask';

var moment = require('moment');

@Component({
  selector: 'listGoalsPage',
  templateUrl: 'listGoalProgressDetail.html'
})
export class ListGoalProgressDetailPage {
  list1: ListGoalsModel = new ListGoalsModel();
  list2: Array<ListGoalWeeks>;
  feed: FeedModel = new FeedModel();
  loading: any;
  resultData: any;
  recId: number;
  curRec: any;
  freshForm: any;
  whiteBox: any;
  thumbsUp: any;

  constructor(
    public nav: NavController,
    public list2Service: ListGoalsService,
    public navParams: NavParams,
    public RestService:RestService,
    public loadingCtrl: LoadingController
  ) {
    this.recId = navParams.get('recId');
    this.feed.category = navParams.get('category');
    this.curRec = RestService.results[this.recId];
    this.freshForm = false;
    this.thumbsUp = "assets/images/thumbsupGreen.jpg";
    this.whiteBox = "assets/images/whiteBox.jpg";
  }

  ionViewWillEnter() {
    var dtNow = moment(new Date());
    var dtExpiration = moment(this.RestService.AuthData.expiration);
    var self = this;

    if (dtNow < dtExpiration) {
      if(!this.freshForm) {
        var refresh = this.navParams.get('refresh') || false;
        if (refresh) {
          console.log('ListGoalProgressDetail - Reload data object');
          this.curRec = this.RestService.results[this.recId];
          this.loading = this.loadingCtrl.create();
          this.loading.present();
          this.loadData();
        }
      } else {
        console.log('ListGoalProgressDetail - ionViewWillEnter - Fresh Form');
        this.freshForm = false;
      }
    } else {
      this.loading = this.loadingCtrl.create();
      this.loading.present();
      this.RestService.refreshCredentials(function(err, results) {
        if (err) {
          console.log('Need to login again!!! - Credentials expired from ListGoalProgressDetail');
          self.loading.dismiss();
          self.RestService.appRestart();
        } else {
          if(!self.freshForm) {
            var refresh = self.navParams.get('refresh') || false;
            if (refresh) {
              console.log('ListGoalProgressDetail - Reload data object');
              self.curRec = self.RestService.results[this.recId];
              self.loading = self.loadingCtrl.create();
              self.loading.present();
              self.loadData();
            }
          } else {
            console.log('ListGoalProgressDetail - ionViewWillEnter - Fresh Form');
            self.freshForm = false;
          }
        }
      });
    }
  }

  ionViewDidLoad() {
    console.log('ListGoalProgressDetail - ionViewDidLoad');
    this.freshForm = true;
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    this.loadData();
  }

  loadData() {
    this.list2 = this.curRec.weeks;
    this.loading.dismiss();
  }

  openRecord(recordId) {
    console.log("Goto Form index: " + recordId);
    //console.log("Recordid from index: " + this.list2[recordId].recordid);
    this.nav.push(FormGoalsPage, { recId: recordId });
    //alert('Open Record:' + recordId);
  }

  shortDate(dateString) {
    //console.log('Short Date Date: '+ dateString);
    //console.log(moment.utc(dateString).format("MMMM DD"));

    return moment.utc(dateString).format("MMMM DD");
  }

  shortEndDate(dateStartString, dateEndString) {
    //console.log('Short EndDate Date: '+ dateEndString);
    if (moment.utc(dateStartString).format("MMMM") !== moment.utc(dateEndString).format("MMMM")) {
      return moment.utc(dateEndString).format("MMMM DD");
    } else {
      return moment.utc(dateEndString).format("DD");
    }
  }

  addToday(item) {
    if (this.curRec.goaltype =='exercise') {
      var blnRefresh = new Boolean;
      blnRefresh = false;
      this.nav.push(FormExercisePage, { goalname: this.curRec.goalname, refresh: blnRefresh});
    } else if (this.curRec.goaltype =='task') {
      this.nav.push(FormTaskPage, { goalname: this.curRec.goalname, refresh: blnRefresh});
    } else {
      alert('Goal type: ' + this.curRec.goaltype);
    }
  }

  notCurrent(index) {
    if (index > 0) {
      return true;
    } else {
      return false;
    }
  }
}