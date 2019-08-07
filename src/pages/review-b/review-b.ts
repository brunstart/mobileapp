import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";

/**
 * Generated class for the ReviewBPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-review-b',
  templateUrl: 'review-b.html',
})
export class ReviewBPage {

  public items:any;
  private dataUrl: string = "assets/example_data/list-new.json";

  @Input() rating: number = 5;

  @Output() ratingChange: EventEmitter<Number> = new EventEmitter();

  constructor(public nav: NavController, public navParams: NavParams,
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

  getColor(index: number) {
    if (this.isAboveRating(index)) {
      return COLORS.GREY;
    }
    switch (this.rating) {
      case 1:
      case 2:
      // return COLORS.RED;
      case 3:
      case 4:
      case 5:
        // return COLORS.GREEN;
        return COLORS.YELLOW;

      default:
        return COLORS.GREY;
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReviewAPage');
  }

  isAboveRating(index: number): boolean {
    return index > this.rating;
  }

  goToB() {
    // this.nav.push();
  }
}



enum COLORS {
  GREY = "#E0E0E0",
  GREEN = "#76FF03",
  YELLOW = "#FFCA28",
  RED = "#DD2C00"
}
