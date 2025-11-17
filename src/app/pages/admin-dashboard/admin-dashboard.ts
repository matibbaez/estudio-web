import { Component } from '@angular/core';
import { CardComponent } from '../../components/card/card'; // 1. IMPORTAR
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent], // 2. AGREGAR
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent {

}