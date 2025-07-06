<!--
  About View - Information about the Dashboard Tiling System
  
  This view provides information about the application,
  its features, and implementation details.
-->

<template>
  <div class="about-view">
    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Header -->
          <div class="text-center py-5">
            <h1 class="display-4 mb-3">Dashboard Tiling System</h1>
            <p class="lead text-muted">
              A flexible, responsive tile-based dashboard layout system
            </p>
            <hr class="my-4">
          </div>

          <!-- Features Section -->
          <div class="row mb-5">
            <div class="col-md-6 mb-4">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-th-large"></i>
                </div>
                <h4>Grid-Based Layout</h4>
                <p>12-column responsive grid system that adapts to different screen sizes automatically.</p>
              </div>
            </div>
            
            <div class="col-md-6 mb-4">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-arrows-alt"></i>
                </div>
                <h4>Drag & Drop</h4>
                <p>Intuitive drag and drop interface for rearranging tiles with visual feedback.</p>
              </div>
            </div>
            
            <div class="col-md-6 mb-4">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-expand-arrows-alt"></i>
                </div>
                <h4>Resizable Tiles</h4>
                <p>Resize tiles using corner and edge handles with grid-snap positioning.</p>
              </div>
            </div>
            
            <div class="col-md-6 mb-4">
              <div class="feature-card">
                <div class="feature-icon">
                  <i class="fas fa-save"></i>
                </div>
                <h4>Layout Persistence</h4>
                <p>Automatically saves your layout configuration to localStorage.</p>
              </div>
            </div>
          </div>

          <!-- Technical Details -->
          <div class="card mb-5">
            <div class="card-header">
              <h3 class="mb-0">
                <i class="fas fa-code me-2"></i>
                Technical Implementation
              </h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h5>Frontend Technologies</h5>
                  <ul class="list-unstyled">
                    <li><i class="fab fa-vuejs text-success me-2"></i>Vue.js 3</li>
                    <li><i class="fas fa-cubes text-primary me-2"></i>TypeScript</li>
                    <li><i class="fab fa-bootstrap text-purple me-2"></i>Bootstrap 5</li>
                    <li><i class="fas fa-rocket text-warning me-2"></i>Vite</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h5>Key Features</h5>
                  <ul class="list-unstyled">
                    <li><i class="fas fa-mobile-alt text-info me-2"></i>Responsive Design</li>
                    <li><i class="fas fa-database text-secondary me-2"></i>Pinia State Management</li>
                    <li><i class="fas fa-universal-access text-success me-2"></i>Accessibility Support</li>
                    <li><i class="fas fa-palette text-danger me-2"></i>Customizable Theming</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Requirements Fulfilled -->
          <div class="card mb-5">
            <div class="card-header">
              <h3 class="mb-0">
                <i class="fas fa-check-circle me-2"></i>
                Requirements Fulfilled
              </h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h5>Core Tile Operations</h5>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Tile Creation
                    </li>
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Tile Deletion
                    </li>
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Tile Resizing
                    </li>
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Tile Rearrangement
                    </li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h5>System Features</h5>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Grid Layout Engine
                    </li>
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Layout Persistence
                    </li>
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Visual Feedback
                    </li>
                    <li class="list-group-item">
                      <i class="fas fa-check text-success me-2"></i>
                      Responsive Design
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="card mb-5">
            <div class="card-header">
              <h3 class="mb-0">
                <i class="fas fa-tachometer-alt me-2"></i>
                Performance Targets
              </h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-sm-6 col-lg-3 text-center mb-3">
                  <div class="metric">
                    <div class="metric-value">&lt;100ms</div>
                    <div class="metric-label">Tile Operations</div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3 text-center mb-3">
                  <div class="metric">
                    <div class="metric-value">&lt;3s</div>
                    <div class="metric-label">Page Load Time</div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3 text-center mb-3">
                  <div class="metric">
                    <div class="metric-value">50+</div>
                    <div class="metric-label">Max Tiles</div>
                  </div>
                </div>
                <div class="col-sm-6 col-lg-3 text-center mb-3">
                  <div class="metric">
                    <div class="metric-value">95%+</div>
                    <div class="metric-label">Browser Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="text-center py-4">
            <router-link to="/" class="btn btn-primary btn-lg">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component logic (if needed)
</script>

<style scoped>
.about-view {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.feature-card {
  text-align: center;
  padding: 2rem 1rem;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  color: #007bff;
  margin-bottom: 1rem;
}

.feature-card h4 {
  color: #343a40;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #6c757d;
  margin: 0;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  background-color: white;
  border-bottom: 1px solid #e9ecef;
  border-radius: 8px 8px 0 0 !important;
}

.list-group-item {
  border: none;
  padding: 0.5rem 0;
}

.metric {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.metric-label {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.text-purple {
  color: #6f42c1 !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .about-view {
    padding: 1rem 0;
  }
  
  .feature-card {
    padding: 1.5rem 1rem;
    margin-bottom: 1rem;
  }
  
  .feature-icon {
    font-size: 2rem;
  }
  
  .metric-value {
    font-size: 1.5rem;
  }
}
</style>
