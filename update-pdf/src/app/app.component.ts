import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  file: any = {};
  filePath: string = '';
  error: string = '';

  constructor(private apiService: ApiService){

  }

  ngOnInit(): void {

  }

  onFileInput = ($event: any) => {
    if ($event?.target?.files.length > 0) {
      this.file = $event?.target?.files[0]
    }
  }

  upload = () => {
    this.filePath = "";
    this.error = "";
    let formData = new FormData();
    formData.append('file', this.file, this.file.name);
    this.apiService.UpdatePdf(formData).subscribe((res: any) => {
      if (res && res.filePath) {
        this.filePath = res.filePath;
      }
    }, (err: any) => {
      if(typeof err.error === 'string') {
        this.error = err.error;
      } else {
        this.error = JSON.stringify(err.error);
      }
      console.log(`error ${JSON.stringify(err)}`);
    });
  }
}
