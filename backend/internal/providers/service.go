package providers

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrVpsNotFound = errors.New("VPS instance not found")
)

type Service struct {
	mu            sync.RWMutex
	vpsInstances  map[string]*VpsInstance
	firewallRules map[string][]*FirewallRule
}

func NewService() *Service {
	s := &Service{
		vpsInstances:  make(map[string]*VpsInstance),
		firewallRules: make(map[string][]*FirewallRule),
	}

	// Seed default VPS servers
	vps1 := &VpsInstance{
		ID:            "vps_98a72c1e89",
		UserID:        "usr_98a72c1e",
		Name:          "prod-api-cluster-01",
		Hostname:      "api-primary.cloudpulse.net",
		PlanID:        "plan_kvm2",
		PlanName:      "KVM 2 Production",
		IPAddress:     "200.234.41.12",
		IPv6Address:   "2a02:4780:11:1010::1",
		Status:        "running",
		Datacenter:    "us-east-1",
		Location:      "Ashburn, VA, United States",
		OSName:        "Debian",
		OSVersion:     "12.5 Bookworm",
		KernelVersion: "6.1.0-21-amd64",
		VCPU:          2,
		RAMGB:         8,
		StorageGB:     100,
		BandwidthTB:   8.0,
		UptimeSeconds: 1048320,
		CreatedAt:     time.Now().AddDate(0, -2, 0),
		UpdatedAt:     time.Now(),
	}

	vps2 := &VpsInstance{
		ID:            "vps_b1c2d3e4f5",
		UserID:        "usr_98a72c1e",
		Name:          "redis-cache-eu",
		Hostname:      "redis-01.cloudpulse.net",
		PlanID:        "plan_kvm1",
		PlanName:      "KVM 1 Starter",
		IPAddress:     "185.193.126.88",
		IPv6Address:   "2a02:4780:22:2020::2",
		Status:        "running",
		Datacenter:    "eu-central-1",
		Location:      "Frankfurt, Germany",
		OSName:        "Ubuntu",
		OSVersion:     "24.04 LTS Noble Numbat",
		KernelVersion: "6.8.0-31-generic",
		VCPU:          1,
		RAMGB:         4,
		StorageGB:     50,
		BandwidthTB:   4.0,
		UptimeSeconds: 432000,
		CreatedAt:     time.Now().AddDate(0, -1, 0),
		UpdatedAt:     time.Now(),
	}

	s.vpsInstances[vps1.ID] = vps1
	s.vpsInstances[vps2.ID] = vps2

	s.firewallRules[vps1.ID] = []*FirewallRule{
		{ID: "fw-1", VpsID: vps1.ID, Type: "inbound", Protocol: "tcp", PortRange: "22", Source: "0.0.0.0/0", Action: "accept", CreatedAt: time.Now()},
		{ID: "fw-2", VpsID: vps1.ID, Type: "inbound", Protocol: "tcp", PortRange: "80, 443", Source: "0.0.0.0/0", Action: "accept", CreatedAt: time.Now()},
		{ID: "fw-3", VpsID: vps1.ID, Type: "inbound", Protocol: "tcp", PortRange: "8080", Source: "0.0.0.0/0", Action: "accept", CreatedAt: time.Now()},
	}

	return s
}

func (s *Service) ListUserVps(_ context.Context, userID string) ([]*VpsInstance, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*VpsInstance
	for _, vps := range s.vpsInstances {
		if vps.UserID == userID || userID == "" {
			result = append(result, vps)
		}
	}
	return result, nil
}

func (s *Service) GetVpsByID(_ context.Context, vpsID string) (*VpsInstance, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	vps, exists := s.vpsInstances[vpsID]
	if !exists {
		return nil, ErrVpsNotFound
	}
	return vps, nil
}

func (s *Service) CreateVps(_ context.Context, userID string, req *CreateVpsRequest) (*VpsInstance, error) {
	if req.Name == "" || req.PlanID == "" {
		return nil, errors.New("VPS name and plan are required")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	randomIP := fmt.Sprintf("194.163.%d.%d", 100+rand.Intn(100), 2+rand.Intn(250))
	id := "vps_" + uuid.New().String()[:10]

	vps := &VpsInstance{
		ID:            id,
		UserID:        userID,
		Name:          req.Name,
		Hostname:      req.Hostname,
		PlanID:        req.PlanID,
		PlanName:      "KVM VPS Instance",
		IPAddress:     randomIP,
		IPv6Address:   fmt.Sprintf("2a02:4780:%x::1", rand.Intn(9999)),
		Status:        "running",
		Datacenter:    req.Datacenter,
		Location:      "Global Cloud Region",
		OSName:        "Ubuntu",
		OSVersion:     "24.04 LTS",
		KernelVersion: "6.8.0-31-generic",
		VCPU:          2,
		RAMGB:         4,
		StorageGB:     50,
		BandwidthTB:   4.0,
		UptimeSeconds: 0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	s.vpsInstances[id] = vps
	return vps, nil
}

func (s *Service) ExecuteAction(_ context.Context, vpsID string, action string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	vps, exists := s.vpsInstances[vpsID]
	if !exists {
		return ErrVpsNotFound
	}

	switch action {
	case "start":
		vps.Status = "running"
	case "stop":
		vps.Status = "stopped"
	case "reboot", "force_reboot":
		vps.Status = "rebooting"
		go func(id string) {
			time.Sleep(3 * time.Second)
			s.mu.Lock()
			if v, ok := s.vpsInstances[id]; ok {
				v.Status = "running"
				v.UptimeSeconds = 0
			}
			s.mu.Unlock()
		}(vpsID)
	default:
		return errors.New("unsupported server action")
	}

	vps.UpdatedAt = time.Now()
	return nil
}

func (s *Service) GetFirewallRules(_ context.Context, vpsID string) ([]*FirewallRule, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.firewallRules[vpsID], nil
}

func (s *Service) AddFirewallRule(_ context.Context, vpsID string, rule *FirewallRule) (*FirewallRule, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rule.ID = "fw-" + uuid.New().String()[:8]
	rule.VpsID = vpsID
	rule.CreatedAt = time.Now()

	s.firewallRules[vpsID] = append(s.firewallRules[vpsID], rule)
	return rule, nil
}
