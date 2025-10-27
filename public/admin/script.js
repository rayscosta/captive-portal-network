// Configuração da API
const API_BASE_URL = '';

// Estado da aplicação
let assets = [];
let commands = [];
let currentEditingAsset = null;

// Auth Functions
const getAuthToken = () => localStorage.getItem('admin_token');
const getAuthUser = () => JSON.parse(localStorage.getItem('admin_user') || 'null');

const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const data = await response.json();
        if (data.user.role !== 'admin') {
            showNotification('Acesso negado. Apenas administradores.', 'error');
            logout();
            return false;
        }

        // Atualizar informações do usuário
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        updateUserInfo(data.user);
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        return false;
    }
};

const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login.html';
};

const updateUserInfo = (user) => {
    // Adicionar informações do usuário no header se houver elemento para isso
    const userInfoEl = document.getElementById('user-info');
    if (userInfoEl) {
        userInfoEl.innerHTML = `
            <span>${user.name} (${user.email})</span>
            <button class="btn btn-secondary" onclick="logout()" style="margin-left: 1rem;">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        `;
    }
};

// Utility Functions
const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
};

const getStatusBadge = (status) => {
    const badges = {
        'PENDING': '<span class="status-badge status-pending">Pendente</span>',
        'DONE': '<span class="status-badge status-done">Concluído</span>',
        'online': '<span class="status-badge status-online">Online</span>',
        'offline': '<span class="status-badge status-offline">Offline</span>'
    };
    return badges[status] || status;
};

const isAssetOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
};

// API Functions
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    if (!token) {
        logout();
        throw new Error('Não autenticado');
    }
    
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            showNotification('Sessão expirada. Faça login novamente.', 'error');
            logout();
            throw new Error('Unauthorized');
        }
        
        if (response.status === 403) {
            showNotification('Acesso negado. Verifique suas permissões.', 'error');
            throw new Error('Forbidden');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            showNotification(`Erro HTTP ${response.status}: ${errorText}`, 'error');
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Para DELETE requests que retornam 204 No Content
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        if (error.message !== 'Unauthorized' && error.message !== 'Forbidden') {
            showNotification(`Erro na comunicação: ${error.message}`, 'error');
        }
        throw error;
    }
};

// Notification System
const showNotification = (message, type = 'info') => {
    // Criar uma notificação visual em vez de alert
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer;">&times;</button>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 9999;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid;
            }
            .notification-error { border-left-color: #f56565; }
            .notification-success { border-left-color: #48bb78; }
            .notification-info { border-left-color: #4299e1; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
};

// Navigation
const initNavigation = () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');

            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'assets': 'Gestão de Ativos',
                'commands': 'Histórico de Comandos'
            };
            pageTitle.textContent = titles[sectionId] || 'Admin';

            // Load section data
            if (sectionId === 'dashboard') loadDashboard();
            if (sectionId === 'assets') loadAssets();
            if (sectionId === 'commands') loadCommands();
        });
    });
};

// Dashboard Functions
const loadDashboard = async () => {
    try {
        await loadAssets();
        await loadCommands();
        updateDashboardStats();
        updateRecentActivity();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
};

const updateDashboardStats = () => {
    const totalAssets = assets.length;
    const onlineAssets = assets.filter(asset => isAssetOnline(asset.last_seen)).length;
    const pendingCommands = commands.filter(cmd => cmd.status === 'PENDING').length;
    const completedCommands = commands.filter(cmd => cmd.status === 'DONE').length;

    document.getElementById('total-assets').textContent = totalAssets;
    document.getElementById('online-assets').textContent = onlineAssets;
    document.getElementById('pending-commands').textContent = pendingCommands;
    document.getElementById('completed-commands').textContent = completedCommands;
};

const updateRecentActivity = () => {
    const activityContainer = document.getElementById('recent-activity');
    const recentCommands = commands
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    if (recentCommands.length === 0) {
        activityContainer.innerHTML = '<div class="activity-item"><i class="fas fa-info-circle"></i><span>Nenhuma atividade recente</span></div>';
        return;
    }

    activityContainer.innerHTML = recentCommands.map(cmd => {
        const asset = assets.find(a => a.id === cmd.asset_id);
        const assetName = asset ? asset.name : `Ativo #${cmd.asset_id}`;
        return `
            <div class="activity-item">
                <i class="fas fa-terminal"></i>
                <span>Comando <strong>${cmd.code}</strong> enviado para <strong>${assetName}</strong> - ${getStatusBadge(cmd.status)}</span>
                <small style="margin-left: auto; color: #718096;">${formatDate(cmd.created_at)}</small>
            </div>
        `;
    }).join('');
};

// Assets Functions
const loadAssets = async () => {
    try {
        assets = await apiRequest('/api/assets');
        renderAssetsTable();
        updateAssetSelect();
    } catch (error) {
        console.error('Failed to load assets:', error);
    }
};

const renderAssetsTable = () => {
    const tbody = document.getElementById('assets-table');
    
    if (assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum ativo encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = assets.map(asset => {
        const isOnline = isAssetOnline(asset.last_seen);
        const status = isOnline ? 'online' : 'offline';
        
        return `
            <tr>
                <td><strong>${asset.name}</strong></td>
                <td>${asset.type}</td>
                <td>${asset.ip || '-'}</td>
                <td>${asset.mac || '-'}</td>
                <td>${getStatusBadge(status)}</td>
                <td>${formatDate(asset.last_seen)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editAsset(${asset.id})" style="margin-right: 0.5rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteAsset(${asset.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

const updateAssetSelect = () => {
    const select = document.getElementById('asset-select');
    select.innerHTML = '<option value="">Selecione um ativo</option>' +
        assets.map(asset => `<option value="${asset.id}">${asset.name}</option>`).join('');
};

// Asset Modal Functions
const openAssetModal = (asset = null) => {
    currentEditingAsset = asset;
    const modal = document.getElementById('asset-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('asset-form');

    title.textContent = asset ? 'Editar Ativo' : 'Novo Ativo';
    
    if (asset) {
        document.getElementById('asset-name').value = asset.name;
        document.getElementById('asset-type').value = asset.type;
        document.getElementById('asset-ip').value = asset.ip || '';
        document.getElementById('asset-mac').value = asset.mac || '';
        document.getElementById('asset-token').value = asset.agent_token;
    } else {
        form.reset();
    }

    modal.style.display = 'block';
};

const closeAssetModal = () => {
    document.getElementById('asset-modal').style.display = 'none';
    currentEditingAsset = null;
};

const editAsset = (id) => {
    const asset = assets.find(a => a.id === id);
    if (asset) openAssetModal(asset);
};

const deleteAsset = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return;

    try {
        await apiRequest(`/api/assets/${id}`, { method: 'DELETE' });
        showNotification('Ativo excluído com sucesso', 'success');
        loadAssets();
    } catch (error) {
        console.error('Failed to delete asset:', error);
    }
};

// Commands Functions
const loadCommands = async () => {
    try {
        // Carregar comandos de todos os ativos
        const allCommands = [];
        for (const asset of assets) {
            try {
                const assetCommands = await apiRequest(`/api/commands/asset/${asset.id}`);
                allCommands.push(...assetCommands.map(cmd => ({ ...cmd, asset_name: asset.name })));
            } catch (error) {
                console.error(`Failed to load commands for asset ${asset.id}:`, error);
            }
        }
        commands = allCommands.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        renderCommandsTable();
    } catch (error) {
        console.error('Failed to load commands:', error);
    }
};

const renderCommandsTable = () => {
    const tbody = document.getElementById('commands-table');
    
    if (commands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum comando encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = commands.map(cmd => `
        <tr>
            <td><strong>${cmd.asset_name || `Ativo #${cmd.asset_id}`}</strong></td>
            <td><code>${cmd.code}</code></td>
            <td>${getStatusBadge(cmd.status)}</td>
            <td>${formatDate(cmd.created_at)}</td>
            <td>${cmd.output ? `<details><summary>Ver resultado</summary><pre style="white-space: pre-wrap; margin-top: 0.5rem;">${cmd.output}</pre></details>` : '-'}</td>
            <td>${cmd.executed_at ? formatDate(cmd.executed_at) : '-'}</td>
        </tr>
    `).join('');
};

const sendCommand = async () => {
    const assetId = document.getElementById('asset-select').value;
    const code = document.getElementById('command-select').value;

    if (!assetId || !code) {
        showNotification('Selecione um ativo e um comando', 'error');
        return;
    }

    try {
        await apiRequest('/api/commands', {
            method: 'POST',
            body: JSON.stringify({ assetId: parseInt(assetId), code })
        });
        
        showNotification('Comando enviado com sucesso', 'success');
        document.getElementById('asset-select').value = '';
        loadCommands();
        
        // Update dashboard if visible
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboardStats();
            updateRecentActivity();
        }
    } catch (error) {
        console.error('Failed to send command:', error);
    }
};

// Event Listeners
const initEventListeners = () => {
    // Navigation
    initNavigation();

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        const activeSection = document.querySelector('.content-section.active').id;
        if (activeSection === 'dashboard') loadDashboard();
        if (activeSection === 'assets') loadAssets();
        if (activeSection === 'commands') loadCommands();
    });

    // Asset modal
    document.getElementById('add-asset-btn').addEventListener('click', () => openAssetModal());
    document.getElementById('close-modal').addEventListener('click', closeAssetModal);
    document.getElementById('cancel-btn').addEventListener('click', closeAssetModal);

    // Asset form submission
    document.getElementById('asset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const assetData = Object.fromEntries(formData.entries());

        try {
            if (currentEditingAsset) {
                await apiRequest(`/api/assets/${currentEditingAsset.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(assetData)
                });
                showNotification('Ativo atualizado com sucesso', 'success');
            } else {
                await apiRequest('/api/assets', {
                    method: 'POST',
                    body: JSON.stringify(assetData)
                });
                showNotification('Ativo criado com sucesso', 'success');
            }
            
            closeAssetModal();
            loadAssets();
        } catch (error) {
            console.error('Failed to save asset:', error);
        }
    });

    // Send command
    document.getElementById('send-command-btn').addEventListener('click', sendCommand);

    // Close modal on outside click
    document.getElementById('asset-modal').addEventListener('click', (e) => {
        if (e.target.id === 'asset-modal') {
            closeAssetModal();
        }
    });
};

// Initialize App
const initApp = async () => {
    // Verificar autenticação antes de inicializar
    const isAuth = await checkAuth();
    if (!isAuth) return;
    
    initEventListeners();
    await loadDashboard();
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
