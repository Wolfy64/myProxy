import { Request } from 'express'
type Mapping = {
  domain: string
  subDomain: string
  port: string
  ip: string
  id: string
  gitLink: string
  fullDomain: string
}

interface AuthenticatedRequest extends Request {
  user?: {
    isAdmin: boolean
    isUser: boolean
  }
}

type MappingById = {
  [mappingId: string]: Mapping
}

type AccessTokenById = {
  [id: string]: AccessToken
}

type Provider = {
  id: string
  service: string
  name: string
  keys: object
  domains: unknown
}

type Domain = {
  domain: string
  expiration: string
  provider: string
}

type ServiceResponse = {
  success: boolean
  message: string
}

type ProviderService = {
  getDomains: Function
  setRecord: Function
}

type ServiceConfig = {
  dns_gd: ProviderService
}

type ProxyMapping = {
  ip?: string
  port?: string
}

type AccessToken = {
  name: string
  id: string
}

type ProviderInfo = {
  NAME: string
  DNS_API: string
  PRIMARY_KEY: string
  SECONDARY_KEY: string
  SERVICE: string
}

export {
  Mapping,
  MappingById,
  Provider,
  Domain,
  ServiceResponse,
  ServiceConfig,
  ProviderService,
  ProxyMapping,
  AccessToken,
  AccessTokenById,
  AuthenticatedRequest,
  ProviderInfo
}
