import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ListNewPage } from './list-new';
import { BackgroundImage } from '../../components/background-image/background-image';


@NgModule({
  declarations: [
    ListNewPage, BackgroundImage
  ],
  imports: [
    IonicPageModule.forChild(ListNewPage),
  ],
})
export class ListNewPageModule {}
