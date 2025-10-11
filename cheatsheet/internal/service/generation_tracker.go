package service

import (
	"context"
	"sync"
	"time"

	"storage/internal/domain"
)

// GenerationResult represents the result of a generation operation
type GenerationResult struct {
	Key    string
	FileID string
	Error  error
}

func (r GenerationResult) IsError() bool {
	return r.Error != nil
}

// GenerationTracker manages pending generation requests
type GenerationTracker struct {
	mu      sync.RWMutex
	pending map[string]chan GenerationResult
	timeout time.Duration
}

// NewGenerationTracker creates a new generation tracker
func NewGenerationTracker(timeout time.Duration) *GenerationTracker {
	return &GenerationTracker{
		pending: make(map[string]chan GenerationResult),
		timeout: timeout,
	}
}

// Register creates a new pending generation request
func (t *GenerationTracker) Register(requestID string) chan GenerationResult {
	t.mu.Lock()
	defer t.mu.Unlock()

	ch := make(chan GenerationResult, 1)
	t.pending[requestID] = ch
	return ch
}

// Complete marks a generation request as complete
func (t *GenerationTracker) Complete(requestID string, result GenerationResult) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	ch, exists := t.pending[requestID]
	if !exists {
		return domain.ErrNotFound
	}

	ch <- result
	close(ch)
	delete(t.pending, requestID)

	return nil
}

// Wait waits for a generation request to complete with timeout
func (t *GenerationTracker) Wait(ctx context.Context, requestID string, resultCh chan GenerationResult) (GenerationResult, error) {
	timeoutCtx, cancel := context.WithTimeout(ctx, t.timeout)
	defer cancel()

	select {
	case result := <-resultCh:
		if result.Error != nil {
			return GenerationResult{}, result.Error
		}
		return result, nil

	case <-timeoutCtx.Done():
		t.mu.Lock()
		delete(t.pending, requestID)
		t.mu.Unlock()
		return GenerationResult{}, domain.ErrTimeout

	case <-ctx.Done():
		t.mu.Lock()
		delete(t.pending, requestID)
		t.mu.Unlock()
		return GenerationResult{}, ctx.Err()
	}
}

// Cleanup removes stale pending requests (call periodically)
func (t *GenerationTracker) Cleanup() {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Close and remove all pending channels
	for id, ch := range t.pending {
		close(ch)
		delete(t.pending, id)
	}
}
