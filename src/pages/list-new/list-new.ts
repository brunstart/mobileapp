import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { ReviewBPage } from '../review-b/review-b';
/**
 * Generated class for the ListNewPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-list-new",
  templateUrl: "list-new.html"
})
export class ListNewPage implements OnInit {
  @Input() rating: number;
  @Output() ratingChange: EventEmitter<Number> = new EventEmitter();
  items: any;
  title: string;
  constructor(public nav: NavController, public navParams: NavParams) {
  }

  ngOnInit() {}

  rate(index: number) {
    this.rating = index;
    this.ratingChange.emit(this.rating);
  }

  getColor(index: number) {
    if (this.isAboveRating(index)) {
      return COLORS.GREY;
    }
    switch (this.rating) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return COLORS.YELLOW;

      default:
        return COLORS.GREY;
    }
  }

  isAboveRating(index: number): boolean {
    return index > this.rating;
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
