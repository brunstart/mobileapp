import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { Observable } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { ReviewBPage } from '../review-b/review-b';
import { ReviewCPage } from '../review-c/review-c';
import { ReviewDPage } from '../review-d/review-d';
import { ReviewEPage } from '../review-e/review-e';

@IonicPage()
@Component({
  selector: "page-list-new",
  templateUrl: "list-new.html"
})
export class ListNewPage implements OnInit {
  @Input() rating: number;
  @Output() ratingChange: EventEmitter<Number> = new EventEmitter();
  blnShowFeed: boolean = false;
  items: any;
  private dataUrl: string = "assets/example_data/newCategory.json";

  constructor(public nav: NavController,
              public navParams: NavParams,
              public http: HttpClient) {
    this.loadData();

  }

  loadData()
  {
    let data:Observable<any>;
    data = this.http.get(this.dataUrl);
    data.subscribe(result => {
      this.items=result;
    })
  }

  ngOnInit() {}

  rate(index: number) {
    this.rating = index;
    this.ratingChange.emit(this.rating);
  }

  goToA(item: any) {
    console.log('Clicked goToA', item.category);
    if (item.category == 'Losing weight') {
      console.log('push to Losing weight');
      this.nav.push(ReviewBPage);
    } else if (item.category == 'Lower stress'){
      console.log('push to Lower stress');
      this.nav.push(ReviewCPage);
    } else if (item.category == 'Overcome diabetes'){
      console.log('push to Overcome diabetes');
      this.nav.push(ReviewDPage);
    } else if (item.category == 'Get muscles'){
      console.log('push to Get muscles');
      this.nav.push(ReviewEPage);
    } else {
      console.log('Failed');
    }
    //this.nav.push(ReviewBPage);
  }
  addNew() {}
}
