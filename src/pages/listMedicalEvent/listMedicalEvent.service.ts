import { Injectable } from "@angular/core";
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { MedicalEventModel } from './listMedicalEvent.model';

@Injectable()
export class MedicalEventService {
  constructor(public http: Http) {}

  getData(): Promise<MedicalEventModel> {
    return this.http.get('./assets/example_data/lists.json')
     .toPromise()
     .then(response => response.json() as MedicalEventModel)
     .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
