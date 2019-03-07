import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { System } from '../../../classes/system';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SystemService {

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type':  'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  private systemUrl = "http://localhost:3000/systems";

  getSystems(): Observable<System[]>
  {
    return this.http.get<System[]>(this.systemUrl);
  }

  createSystem(system: System): Observable<Number> 
  {
    return this.http.post<Number>(this.systemUrl, JSON.stringify(system), this.httpOptions);
  }

  updateSystem(system: System): Observable<System>
  {
    return this.http.put<System>(this.systemUrl, system);
  }

  removeSystem(system: System): Observable<System> 
  {
    return this.http.delete<System>(`${this.systemUrl}/${system.systemID}`);
  }
}
