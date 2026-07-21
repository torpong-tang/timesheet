import { Session } from 'next-auth'

export const mockAdminSession: Session = {
    user: {
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@example.com',
        userlogin: 'admin',
        role: 'ADMIN',
        status: 'Enable',
        image: null,
        mustChangePassword: false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockGMSession: Session = {
    user: {
        id: 'gm-user-id',
        name: 'GM User',
        email: 'gm@example.com',
        userlogin: 'gm',
        role: 'GM',
        status: 'Enable',
        image: null,
        mustChangePassword: false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockPMSession: Session = {
    user: {
        id: 'pm-user-id',
        name: 'PM User',
        email: 'pm@example.com',
        userlogin: 'pm',
        role: 'PM',
        status: 'Enable',
        image: null,
        mustChangePassword: false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockDevSession: Session = {
    user: {
        id: 'dev-user-id',
        name: 'Dev User',
        email: 'dev@example.com',
        userlogin: 'dev',
        role: 'DEV',
        status: 'Enable',
        image: null,
        mustChangePassword: false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}
