import { Entity } from "../../../_shared/domain/models/entity";
import { AgentStatus } from "../value-objects/agent-status";
import { AgentType } from "../value-objects/agent-type";
import { ConnectionToken } from "../value-objects/connection-token";

interface AgentProps {
  id: string;
  organizationId: string;
  name: string;
  type: AgentType;
  tokenHash: string;
  tokenPrefix: string;
  status: AgentStatus;
  lastSeenAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Agent extends Entity {
  private _organizationId: string;
  private _name: string;
  private _type: AgentType;
  private _tokenHash: string;
  private _tokenPrefix: string;
  private _status: AgentStatus;
  private _lastSeenAt: Date | null;
  private _createdBy: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(props: AgentProps) {
    super(props.id);
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._type = props.type;
    this._tokenHash = props.tokenHash;
    this._tokenPrefix = props.tokenPrefix;
    this._status = props.status;
    this._lastSeenAt = props.lastSeenAt;
    this._createdBy = props.createdBy;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  get isActive(): boolean {
    return this._status === AgentStatus.ACTIVE;
  }

  get isInactive(): boolean {
    return this._status === AgentStatus.INACTIVE;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this._organizationId === organizationId;
  }

  wasCreatedBy(userId: string): boolean {
    return this._createdBy === userId;
  }

  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  markActive(): void {
    this._status = AgentStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  markInactive(): void {
    this._status = AgentStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  updateLastSeen(): void {
    this._lastSeenAt = new Date();
    this._updatedAt = new Date();
  }

  regenerateToken(): ConnectionToken {
    const token = ConnectionToken.generate();
    this._tokenHash = token.hash;
    this._tokenPrefix = token.prefix;
    this._updatedAt = new Date();
    return token;
  }

  softDelete(): void {
    this._deletedAt = new Date();
    this._status = AgentStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  verifyToken(rawToken: string): boolean {
    return ConnectionToken.verify(rawToken, this._tokenHash);
  }

  toPrimitives() {
    return {
      id: this.id,
      organizationId: this._organizationId,
      name: this._name,
      type: this._type,
      tokenHash: this._tokenHash,
      tokenPrefix: this._tokenPrefix,
      status: this._status,
      lastSeenAt: this._lastSeenAt,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  static create(props: AgentProps): Agent {
    return new Agent(props);
  }

  static createNew(params: {
    id: string;
    organizationId: string;
    name: string;
    type: AgentType;
    createdBy: string;
  }): { agent: Agent; token: ConnectionToken } {
    const token = ConnectionToken.generate();
    const now = new Date();
    const agent = new Agent({
      id: params.id,
      organizationId: params.organizationId,
      name: params.name,
      type: params.type,
      tokenHash: token.hash,
      tokenPrefix: token.prefix,
      status: AgentStatus.INACTIVE,
      lastSeenAt: null,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    return { agent, token };
  }
}
