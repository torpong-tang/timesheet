import { Session } from 'next-auth'

export const mockAdminSession: Session = {
    user: {
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockGMSession: Session = {
    user: {
        id: 'gm-user-id',
        name: 'GM User',
        email: 'gm@example.com',
        role: 'GM',
        image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockPMSession: Session = {
    user: {
        id: 'pm-user-id',
        name: 'PM User',
        email: 'pm@example.com',
        role: 'PM',
        image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockDevSession: Session = {
    user: {
        id: 'dev-user-id',
        name: 'Dev User',
        email: 'dev@example.com',
        role: 'DEV',
        image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}
