import { PublicKey } from '@solana/web3.js';
import { MAX_POSITIONS } from '../constants'; // Import the constant
import { User } from 'lucide-react';
import * as borsh from 'borsh'; // Make sure to import borsh

export enum Side {
  None,
  Long,
  Short,
}
export interface OrderBookEntry {
  price: number;
  size: number;
}
export class Position {
  owner: PublicKey; // Explicitly declaring class properties
  pool: PublicKey;
  custody: PublicKey;
  collateral_custody: PublicKey;
  open_time: number;
  update_time: number;
  side: Side;
  price: number;
  size_usd: number;
  borrow_size_usd: number;
  collateral_usd: number;
  unrealized_profit_usd: number;
  unrealized_loss_usd: number;
  cumulative_interest_snapshot: number;
  locked_amount: number;
  collateral_amount: number;

  constructor(
    fields: {
      owner: PublicKey;
      pool: PublicKey;
      custody: PublicKey;
      collateral_custody: PublicKey;
      open_time: number;
      update_time: number;
      side: Side;
      price: number;
      size_usd: number;
      borrow_size_usd: number;
      collateral_usd: number;
      unrealized_profit_usd: number;
      unrealized_loss_usd: number;
      cumulative_interest_snapshot: number;
      locked_amount: number;
      collateral_amount: number;
    }
  ) {
    // Explicitly assigning fields
    this.owner = fields.owner;
    this.pool = fields.pool;
    this.custody = fields.custody;
    this.collateral_custody = fields.collateral_custody;
    this.open_time = fields.open_time;
    this.update_time = fields.update_time;
    this.side = fields.side;
    this.price = fields.price;
    this.size_usd = fields.size_usd;
    this.borrow_size_usd = fields.borrow_size_usd;
    this.collateral_usd = fields.collateral_usd;
    this.unrealized_profit_usd = fields.unrealized_profit_usd;
    this.unrealized_loss_usd = fields.unrealized_loss_usd;
    this.cumulative_interest_snapshot = fields.cumulative_interest_snapshot;
    this.locked_amount = fields.locked_amount;
    this.collateral_amount = fields.collateral_amount;
  }

  // Define schema for borsh serialization
  static schema: borsh.Schema = new Map([
    [
      Position,
      {
        kind: 'struct',
        fields: [
          ['owner', [32]],
          ['pool', [32]],
          ['custody', [32]],
          ['collateral_custody', [32]],
          ['open_time', 'i64'],
          ['update_time', 'i64'],
          ['side', 'u8'],
          ['price', 'u64'],
          ['size_usd', 'u64'],
          ['borrow_size_usd', 'u64'],
          ['collateral_usd', 'u64'],
          ['unrealized_profit_usd', 'u64'],
          ['unrealized_loss_usd', 'u64'],
          ['cumulative_interest_snapshot', 'u128'],
          ['locked_amount', 'u64'],
          ['collateral_amount', 'u64'],
        ],
      },
    ],
  ]);
}
export class UserPositions {
    owner: PublicKey;
    next_position_idx: number;
    positions: Position[];


    constructor(fields: {owner: PublicKey, next_position_idx: number, positions: Position[]}) {
        this.owner = fields.owner;
        this.next_position_idx = fields.next_position_idx;
        this.positions = fields.positions;
    }

    static schema = new Map([
        [UserPositions, { 
          kind: 'struct', 
          fields: [
            ['owner', [32]],
            ['next_position_idx', 'u64'],
            ['positions', [Position, MAX_POSITIONS]]
          ] 
        }]
      ]);
}




/// Types for Swap -> Token, TokenSelectorProps, SwapButtonPropos, TokenModalProps

export interface Token {
  symbol: string;
  name: string;
  icon: string;
}

export interface TokenSelectorProps {
  token: Token;
  onClick: () => void;
  amount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isInput: boolean;
}

export interface SwapButtonProps {
  onClick: () => void;
}

export interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelect: (token: Token) => void;
}