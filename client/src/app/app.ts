import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Added HttpHeaders
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  // 1. Connection Variables
  apiUrl = 'https://kinetic-tasks.onrender.com/api/tasks'; // Make sure this matches your Render URL
  // apiUrl = 'http://localhost:5000/api'; // <--- Use this for testing
  // 2. Auth Variables
  isLoggedIn = false;
  authMode = 'login'; // 'login' or 'register'
  username = '';
  password = '';
  token = '';

  // 3. Task Variables
  tasks: any[] = [];
  newTask = '';
  selectedEnergy = 'Medium';
  currentMood = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Check if user is already logged in (saved in browser)
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token = savedToken;
      this.isLoggedIn = true;
      this.setMood('Normal'); // Load default tasks
    }
  }

  // --- AUTHENTICATION FUNCTIONS ---

  toggleAuthMode() {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
  }

  authenticate() {
    const url = `${this.apiUrl}/${this.authMode}`;
    const user = { username: this.username, password: this.password };

    this.http.post<any>(url, user).subscribe({
      next: (res) => {
        if (this.authMode === 'login') {
          this.token = res.token;
          this.isLoggedIn = true;
          localStorage.setItem('token', this.token); // Save to browser
          this.setMood('Normal'); // Load tasks
        } else {
          alert('Registration successful! Please login.');
          this.authMode = 'login';
        }
      },
      error: (err) => alert(err.error.error || 'Authentication failed')
    });
  }

  logout() {
    this.token = '';
    this.isLoggedIn = false;
    localStorage.removeItem('token');
    this.tasks = [];
    this.username = '';
    this.password = '';
  }

  // --- HELPER: Create Security Headers ---
  getHeaders() {
    return {
      headers: new HttpHeaders({ 'Authorization': this.token })
    };
  }

  // --- TASK FUNCTIONS (Now Protected 🔒) ---

  setMood(mood: string) {
    this.currentMood = mood;
    let requiredEnergy = 'Medium';
    if (mood === 'Tired') requiredEnergy = 'Low';
    if (mood === 'Energetic') requiredEnergy = 'High';
    this.fetchTasks(requiredEnergy);
  }

  fetchTasks(energy: string) {
    // We add 'this.getHeaders()' to prove we are logged in
    this.http.get<any[]>(`${this.apiUrl}/tasks/${energy}`, this.getHeaders())
      .subscribe(data => this.tasks = data);
  }

  addTask() {
    if(!this.newTask) return;
    const taskData = { title: this.newTask, energy: this.selectedEnergy };
    
    this.http.post(`${this.apiUrl}/tasks`, taskData, this.getHeaders())
      .subscribe(() => {
        this.newTask = '';
        alert('Task saved!');
        // Refresh the list immediately if it matches current energy
        if(this.selectedEnergy === 'Medium' && this.currentMood === 'Normal') this.fetchTasks('Medium');
        // (Simplification: You can call setMood(this.currentMood) to refresh correctly)
        this.setMood(this.currentMood || 'Normal');
      });
  }

  markDone(id: string) {
    this.http.put(`${this.apiUrl}/tasks/${id}`, {}, this.getHeaders()).subscribe(() => {
      this.tasks = this.tasks.filter(t => t._id !== id);
    });
  }

  deleteTask(id: string) {
    if(!confirm("Delete this task?")) return;
    this.http.delete(`${this.apiUrl}/tasks/${id}`, this.getHeaders()).subscribe(() => {
      this.tasks = this.tasks.filter(t => t._id !== id);
    });
  }
}