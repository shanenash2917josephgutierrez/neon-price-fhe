import { motion } from 'framer-motion';
import { Clock, TrendingUp, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Position {
  id: string;
  asset: string;
  lowerBound: number;
  upperBound: number;
  betAmount: number;
  timestamp: Date;
  status: 'pending' | 'won' | 'lost' | 'encrypted';
  settledPrice?: number;
}

// Position table displaying historical predictions
export const PositionTable = () => {
  // Mock data for demonstration
  const positions: Position[] = [
    {
      id: '0x1a2b3c',
      asset: 'BTC/USD',
      lowerBound: 41000,
      upperBound: 44000,
      betAmount: 0.5,
      timestamp: new Date(Date.now() - 3600000),
      status: 'pending',
    },
    {
      id: '0x4d5e6f',
      asset: 'ETH/USD',
      lowerBound: 2200,
      upperBound: 2400,
      betAmount: 1.0,
      timestamp: new Date(Date.now() - 7200000),
      status: 'won',
      settledPrice: 2350,
    },
    {
      id: '0x7g8h9i',
      asset: 'BTC/USD',
      lowerBound: 45000,
      upperBound: 48000,
      betAmount: 0.25,
      timestamp: new Date(Date.now() - 10800000),
      status: 'lost',
      settledPrice: 44500,
    },
  ];

  const getStatusBadge = (status: Position['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-secondary text-secondary font-mono">
            <Clock className="w-3 h-3 mr-1" />
            PENDING
          </Badge>
        );
      case 'won':
        return (
          <Badge variant="outline" className="border-secondary text-secondary font-mono bg-secondary/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            WON
          </Badge>
        );
      case 'lost':
        return (
          <Badge variant="outline" className="border-destructive text-destructive font-mono bg-destructive/10">
            <XCircle className="w-3 h-3 mr-1" />
            LOST
          </Badge>
        );
      case 'encrypted':
        return (
          <Badge variant="outline" className="border-accent text-accent font-mono">
            <Lock className="w-3 h-3 mr-1" />
            ENCRYPTED
          </Badge>
        );
    }
  };

  return (
    <Card className="border-2 border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          PREDICTION HISTORY
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/20">
                <TableHead className="font-mono text-muted-foreground">ID</TableHead>
                <TableHead className="font-mono text-muted-foreground">ASSET</TableHead>
                <TableHead className="font-mono text-muted-foreground">RANGE</TableHead>
                <TableHead className="font-mono text-muted-foreground">BET</TableHead>
                <TableHead className="font-mono text-muted-foreground">TIME</TableHead>
                <TableHead className="font-mono text-muted-foreground">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position, index) => (
                <motion.tr
                  key={position.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="font-mono text-sm text-accent">
                    {position.id}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-bold">
                    {position.asset}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-accent">${position.lowerBound.toLocaleString()}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-secondary">${position.upperBound.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {position.betAmount} ETH
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {position.timestamp.toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(position.status)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {positions.length === 0 && (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-mono">No predictions yet. Start by making your first encrypted bet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
