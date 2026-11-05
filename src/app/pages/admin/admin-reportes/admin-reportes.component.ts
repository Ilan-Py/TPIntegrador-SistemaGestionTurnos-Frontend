import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DashboardReportes } from '../../../models/reporte.model';
import { ReporteService } from '../../../core/services/reporte.service';

@Component({
  selector: 'app-admin-reportes',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './admin-reportes.component.html',
  styleUrl: './admin-reportes.component.css'
})
export class AdminReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('especialidadChart') private especialidadCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sedeChart') private sedeCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('medicoChart') private medicoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cancelacionChart') private cancelacionCanvas?: ElementRef<HTMLCanvasElement>;

  private fb = inject(FormBuilder);
  private reporteService = inject(ReporteService);
  private charts: Chart[] = [];
  private vistaLista = false;
  private frameGraficos: number | null = null;

  readonly hoy = this.fechaLocal(new Date());
  readonly datos = signal<DashboardReportes | null>(null);
  readonly cargando = signal(false);
  readonly errorMensaje = signal('');

  rango = this.fb.nonNullable.group({
    desde: [this.fechaLocal(this.diasAtras(29)), Validators.required],
    hasta: [this.hoy, Validators.required]
  });

  ngOnInit(): void {
    this.cargarDashboard();
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;
    this.renderizarGraficos();
  }

  ngOnDestroy(): void {
    if (this.frameGraficos !== null) cancelAnimationFrame(this.frameGraficos);
    this.destruirGraficos();
  }

  aplicarRango(): void {
    if (this.rango.invalid) {
      this.rango.markAllAsTouched();
      return;
    }

    const { desde, hasta } = this.rango.getRawValue();
    if (desde > hasta) {
      this.errorMensaje.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    if (hasta > this.hoy) {
      this.errorMensaje.set('El rango de fechas no puede incluir días futuros.');
      return;
    }
    this.cargarDashboard();
  }

  private cargarDashboard(): void {
    const rango = this.rango.getRawValue();
    this.cargando.set(true);
    this.errorMensaje.set('');
    this.reporteService.dashboard(rango).subscribe({
      next: respuesta => {
        this.cargando.set(false);
        if (!respuesta.datos) {
          this.errorMensaje.set(respuesta.estado || 'El servidor no devolvió los indicadores.');
          this.datos.set(null);
          this.destruirGraficos();
          return;
        }
        this.datos.set(respuesta.datos);
        this.programarRenderizado();
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.errorMensaje.set(this.mensajeError(error));
        this.datos.set(null);
        this.destruirGraficos();
      }
    });
  }

  private programarRenderizado(): void {
    if (this.frameGraficos !== null) cancelAnimationFrame(this.frameGraficos);
    this.frameGraficos = requestAnimationFrame(() => {
      this.frameGraficos = null;
      this.renderizarGraficos();
    });
  }

  private renderizarGraficos(): void {
    const datos = this.datos();
    if (!this.vistaLista || !datos || !this.especialidadCanvas ||
        !this.sedeCanvas || !this.medicoCanvas || !this.cancelacionCanvas) {
      return;
    }

    this.destruirGraficos();
    this.charts = [
      new Chart(this.especialidadCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: datos.porEspecialidad.map(item => item.nombre),
          datasets: [{
            label: 'Turnos',
            data: datos.porEspecialidad.map(item => item.cantidad_turnos),
            backgroundColor: '#3578c8',
            borderRadius: 6
          }]
        },
        options: this.opcionesBarras()
      }),
      new Chart(this.sedeCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: datos.porSede.map(item => item.nombre),
          datasets: [{
            label: 'Turnos',
            data: datos.porSede.map(item => item.cantidad_turnos),
            backgroundColor: '#27a6a1',
            borderRadius: 6
          }]
        },
        options: this.opcionesBarras()
      }),
      new Chart(this.medicoCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: datos.rankingMedicos.map(item => `${item.apellido}, ${item.nombre}`),
          datasets: [{
            label: 'Turnos atendidos',
            data: datos.rankingMedicos.map(item => item.cantidad_turnos),
            backgroundColor: '#8b72c7',
            borderRadius: 6
          }]
        },
        options: this.opcionesBarras()
      }),
      new Chart(this.cancelacionCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Cancelados', 'No cancelados'],
          datasets: [{
            data: [
              datos.tasaCancelacion.total_cancelados,
              Math.max(datos.tasaCancelacion.total_turnos - datos.tasaCancelacion.total_cancelados, 0)
            ],
            backgroundColor: ['#d85c55', '#4b9b75'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
          }
        }
      })
    ];
  }

  private opcionesBarras(): NonNullable<ConstructorParameters<typeof Chart>[1]>['options'] {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    };
  }

  private destruirGraficos(): void {
    for (const chart of this.charts) chart.destroy();
    this.charts = [];
  }

  private diasAtras(dias: number): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha;
  }

  private fechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) {
      return error.message;
    }


    if (error instanceof HttpErrorResponse) {
      const payload: unknown = error.error;
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'estado' in payload &&
        typeof payload.estado === 'string'
      ) {
        return payload.estado;
      }
      if (error.status === 0) return 'No se pudo conectar con el backend. Verificá que esté disponible.';
    }
    return 'No se pudieron cargar los reportes.';
  }
}
