import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
}

/**
 * Diálogo de confirmación de Angular Material (reemplaza a window.confirm).
 *
 * Uso:
 *   this.dialog.open(ConfirmarDialogoComponent, {
 *     data: { titulo: 'Eliminar sede', mensaje: '¿Está seguro de eliminar la sede "Centro"?' }
 *   }).afterClosed().subscribe(confirmado => { if (confirmado) { ... } });
 */
@Component({
  selector: 'app-confirmar-dialogo',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>{{ datos.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" cdkFocusInitial>
        {{ datos.textoConfirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmarDialogoComponent {
  datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}
