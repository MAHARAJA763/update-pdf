import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient
  ) { }

  UpdatePdf = (payload: any) => {
    let url = 'http://localhost:1337/api/pdf';
    return this.http.post(url, payload)
  }
}
