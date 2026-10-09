import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegistroRequest,
  AuthResponse,
  Usuario,
  ApiResponse
} from '../../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'clinica_token';
  private readonly USUARIO_KEY = 'clinica_usuario';

  private _usuario = signal<Usuario | null>(this.cargarUsuarioStorage());
  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  readonly usuario = this._usuario.asReadonly();
  readonly token = this._token.asReadonly();
  readonly estaLogueado = computed(() => !!this._token());
  readonly rol = computed(() => this._usuario()?.rol ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, datos).pipe(
      tap(res => {
        if (res.datos?.token) {
          this.guardarSesion(res.datos.token, res.datos.usuario);
        }
      })
    );
  }

  registro(datos: RegistroRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/auth/registro`, datos);
  }

  perfil(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${environment.apiUrl}/auth/perfil`);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USUARIO_KEY);
    this._token.set(null);
    this._usuario.set(null);
    this.router.navigate(['/']);
  }

  private guardarSesion(token: string, usuario: Usuario): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USUARIO_KEY, JSON.stringify(usuario));
    this._token.set(token);
    this._usuario.set(usuario);
  }

  private cargarUsuarioStorage(): Usuario | null {
    try {
      const raw = localStorage.getItem(this.USUARIO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
