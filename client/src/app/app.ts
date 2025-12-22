import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // <--- Add this
import { FormsModule } from '@angular/forms';   // <--- Add this

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('client');

  // We will update this URL later for deployment
  apiUrl = 'https://kinetic-tasks.onrender.com/api/tasks';
  
  tasks: any[] = [];
  newTask = '';
  selectedEnergy = 'Medium';
  currentMood = '';

  constructor(private http: HttpClient) {}

  // User selects their current mood
  setMood(mood: string) {
    this.currentMood = mood;
    let requiredEnergy = 'Medium';
    
    if (mood === 'Tired') requiredEnergy = 'Low';
    if (mood === 'Energetic') requiredEnergy = 'High';

    this.fetchTasks(requiredEnergy);
  }

  // Fetch from Backend
  fetchTasks(energy: string) {
    this.http.get<any[]>(`${this.apiUrl}/${energy}`)
      .subscribe(data => this.tasks = data);
  }

  // Add Task
  addTask() {
    if(!this.newTask) return;
    const taskData = { title: this.newTask, energy: this.selectedEnergy };
    this.http.post(this.apiUrl, taskData).subscribe(() => {
      this.newTask = '';
      alert('Task saved to Kinetic!');
    });
  }

  // Mark Done
  markDone(id: string) {
    this.http.put(`${this.apiUrl}/${id}`, {}).subscribe(() => {
      // Remove task from view immediately
      this.tasks = this.tasks.filter(t => t._id !== id);
    });
  }

  // Permanently remove task
  deleteTask(id: string) {
    if(!confirm("Are you sure you want to delete this?")) return;
    
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      // Remove from the list visually
      this.tasks = this.tasks.filter(t => t._id !== id);
    });
  }
}
