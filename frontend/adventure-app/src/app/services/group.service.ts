import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface GroupListItem {
  id: string;
  name: string;
  memberCount: number;
}
export interface GroupMember {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}
export interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
}
export interface AddableFriend {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}



@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private readonly apiUrl = environment.apiUrl + '/groups';
  constructor(private http: HttpClient) { }

  getMyGroups(): Observable<GroupListItem[]> {
    return this.http.get<GroupListItem[]>(this.apiUrl);
  }
  getGroupDetails(groupId: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.apiUrl}/${groupId}`);
  }

  createGroup(name: string, description: string | null): Observable<any> {
    return this.http.post(this.apiUrl, { name, description });
  }
  addMember(groupId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${groupId}/members`, { userId });
  }
  getAddableFriends(groupId: string): Observable<AddableFriend[]> {
  return this.http.get<AddableFriend[]>(`${this.apiUrl}/${groupId}/addable-friends`);
}
addMembers(groupId: string, userIds: string[]): Observable<any> {
  // The backend expects an object with a "userIds" property which is an array
  return this.http.post(`${this.apiUrl}/${groupId}/members/batch`, { userIds });
}
}
