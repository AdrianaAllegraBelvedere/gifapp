import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SearchResponse, Gif } from '../interfaces/gifs.interfaces';

@Injectable({ providedIn: 'root' })
export class GifsService {

  public gifList: Gif[] = [];

  private _tagsHistory: string[] = [];

  private apiKey: string = 'YrVGv5PMyC0lEA5wl1YpS0cgIGzRsM4x';
  private serviceUrl: string = 'https://api.giphy.com/v1/gifs';

  // Lo que se muestra cuando no hay historial (primera vez o después de limpiar)
  private readonly defaultTag: string = 'Harry Potter';

  constructor(private http: HttpClient) {
    this.loadLocalStorage();
    console.log('Gifs Service Ready');
  }

  get tagsHistory(): string[] {
    return [...this._tagsHistory];
  }

  // Mantiene historial: sin duplicados, max 10, persiste
  private organizeHistory(tag: string): void {
    tag = tag.toLowerCase();

    if (this._tagsHistory.includes(tag)) {
      this._tagsHistory = this._tagsHistory.filter(oldTag => oldTag !== tag);
    }

    this._tagsHistory.unshift(tag);
    this._tagsHistory = this._tagsHistory.splice(0, 10);

    this.saveLocalStorage();
  }

  private saveLocalStorage(): void {
    localStorage.setItem('history', JSON.stringify(this._tagsHistory));
  }

  // Carga inicial:
  // - si no hay history => muestra default
  // - si hay history vacío => muestra default
  // - si hay history con data => muestra el primero
  private loadLocalStorage(): void {
    const raw = localStorage.getItem('history');

    if (!raw) {
      this.fetchGifs(this.defaultTag);
      return;
    }

    this._tagsHistory = JSON.parse(raw);

    if (!this._tagsHistory || this._tagsHistory.length === 0) {
      this.fetchGifs(this.defaultTag);
      return;
    }

    this.fetchGifs(this._tagsHistory[0]);
  }

  // Solo hace la request (no toca historial)
  private fetchGifs(tag: string): void {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('limit', '10')
      .set('q', tag);

    this.http
      .get<SearchResponse>(`${this.serviceUrl}/search`, { params })
      .subscribe(resp => {
        this.gifList = resp.data;
      });
  }

  // Acción del usuario: busca + guarda en historial
  searchTag(tag: string): void {
    tag = tag.trim();
    if (!tag) return;

    this.organizeHistory(tag);
    this.fetchGifs(tag);
  }

  // Limpia historial pero deja algo mostrado (default),
  // sin volver a escribir el default en historial
  clearHistory(): void {
    this._tagsHistory = [];
    this.saveLocalStorage();
    this.fetchGifs(this.defaultTag);
  }
}
