import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { Observable } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { ReviewBPage } from '../review-b/review-b';

@IonicPage()
@Component({
  selector: "page-list-new",
  templateUrl: "list-new.html"
})
export class ListNewPage implements OnInit {
  @Input() rating: number;
  @Output() ratingChange: EventEmitter<Number> = new EventEmitter();
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

  goToA() {
    this.nav.push(ReviewBPage);
  }
  addNew() {}
}

enum COLORS {
  GREY = "#E0E0E0",
  GREEN = "#76FF03",
  YELLOW = "#FFCA28",
  RED = "#DD2C00"
}
