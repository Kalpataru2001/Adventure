import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ChatMessage } from '../models/chat-message.model'; // <-- Import the new model

@Injectable({ providedIn: 'root' })
export class GroupChatService {
    constructor() { }
}