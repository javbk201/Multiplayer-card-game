import Phaser from 'phaser';
import { useGameStore } from '../../stores/gameStore';
import type { Card } from '../../stores/gameStore';

export class MainScene extends Phaser.Scene {
  private cards: Map<string, Phaser.GameObjects.Container> = new Map();
  private gameStore: any;
  private unsubscribe?: () => void;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create simple colored rectangles for cards
    this.load.image('card-back', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // Create card suits as simple graphics
    this.createCardGraphics();
  }

  create() {
    this.gameStore = useGameStore.getState();
    
    // Subscribe to store changes
    this.unsubscribe = useGameStore.subscribe(
      (state) => state.players,
      (players) => this.updatePlayerHands(players)
    );

    // Subscribe to selected card changes
    useGameStore.subscribe(
      (state) => state.selectedCard,
      (selectedCard) => this.highlightSelectedCard(selectedCard)
    );

    // Draw game table
    this.drawGameTable();
    
    // Initialize player areas
    this.initializePlayerAreas();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private createCardGraphics() {
    // Create card back
    const cardBack = this.add.graphics();
    cardBack.fillStyle(0x000080);
    cardBack.fillRoundedRect(0, 0, 60, 84, 8);
    cardBack.lineStyle(2, 0xffffff);
    cardBack.strokeRoundedRect(0, 0, 60, 84, 8);
    cardBack.generateTexture('card-back', 60, 84);
    cardBack.destroy();

    // Create card front template
    const cardFront = this.add.graphics();
    cardFront.fillStyle(0xffffff);
    cardFront.fillRoundedRect(0, 0, 60, 84, 8);
    cardFront.lineStyle(2, 0x000000);
    cardFront.strokeRoundedRect(0, 0, 60, 84, 8);
    cardFront.generateTexture('card-front', 60, 84);
    cardFront.destroy();
  }

  private drawGameTable() {
    // Draw table background
    const table = this.add.graphics();
    table.fillStyle(0x1a4d1a);
    table.fillEllipse(600, 400, 800, 600);
    table.lineStyle(4, 0x2d5016);
    table.strokeEllipse(600, 400, 800, 600);

    // Draw center area for played cards
    const center = this.add.graphics();
    center.fillStyle(0x0f2b0f);
    center.fillEllipse(600, 400, 200, 150);
    center.lineStyle(2, 0x2d5016);
    center.strokeEllipse(600, 400, 200, 150);

    // Add table text
    this.add.text(600, 400, 'Card Game Table', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  private initializePlayerAreas() {
    // Player positions around the table
    const playerPositions = [
      { x: 600, y: 700, rotation: 0 },    // Bottom (current player)
      { x: 200, y: 400, rotation: 90 },   // Left
      { x: 600, y: 100, rotation: 180 },  // Top
      { x: 1000, y: 400, rotation: -90 }  // Right
    ];

    playerPositions.forEach((pos, index) => {
      this.createPlayerArea(pos.x, pos.y, pos.rotation, index);
    });
  }

  private createPlayerArea(x: number, y: number, rotation: number, playerIndex: number) {
    // Player area background
    const area = this.add.graphics();
    area.fillStyle(0x1a4d1a, 0.3);
    area.fillRoundedRect(-150, -50, 300, 100, 10);
    area.x = x;
    area.y = y;
    area.rotation = Phaser.Math.DegToRad(rotation);

    // Player name placeholder
    this.add.text(x, y - 30, `Player ${playerIndex + 1}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  private updatePlayerHands(players: any[]) {
    // Clear existing cards
    this.cards.forEach(card => card.destroy());
    this.cards.clear();

    players.forEach((player, playerIndex) => {
      this.renderPlayerHand(player, playerIndex);
    });
  }

  private renderPlayerHand(player: any, playerIndex: number) {
    const positions = [
      { x: 600, y: 650, spread: 80 },    // Bottom (current player)
      { x: 150, y: 400, spread: 60 },    // Left
      { x: 600, y: 150, spread: 80 },    // Top
      { x: 1050, y: 400, spread: 60 }    // Right
    ];

    const pos = positions[playerIndex] || positions[0];
    const isCurrentPlayer = playerIndex === 0; // Assume bottom is current player for now

    player.hand.forEach((card: Card, cardIndex: number) => {
      const cardContainer = this.createCard(card, isCurrentPlayer);
      
      // Position cards in hand
      const offsetX = (cardIndex - (player.hand.length - 1) / 2) * (pos.spread / Math.max(1, player.hand.length - 1));
      cardContainer.x = pos.x + offsetX;
      cardContainer.y = pos.y;

      // Add hover effects for current player
      if (isCurrentPlayer) {
        this.addCardInteractivity(cardContainer, card);
      }

      this.cards.set(card.id, cardContainer);
    });
  }

  private createCard(card: Card, showFront: boolean = true): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    
    if (showFront) {
      // Card front
      const cardBg = this.add.image(0, 0, 'card-front');
      container.add(cardBg);

      // Card rank
      const rankText = this.add.text(-20, -30, card.rank, {
        fontSize: '14px',
        color: this.getCardColor(card.suit),
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      container.add(rankText);

      // Card suit symbol
      const suitText = this.add.text(0, 0, this.getSuitSymbol(card.suit), {
        fontSize: '20px',
        color: this.getCardColor(card.suit),
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      container.add(suitText);
    } else {
      // Card back
      const cardBack = this.add.image(0, 0, 'card-back');
      container.add(cardBack);
    }

    return container;
  }

  private addCardInteractivity(cardContainer: Phaser.GameObjects.Container, card: Card) {
    cardContainer.setSize(60, 84);
    cardContainer.setInteractive();

    cardContainer.on('pointerdown', () => {
      this.gameStore.selectCard(card);
    });

    cardContainer.on('pointerover', () => {
      cardContainer.y -= 10;
    });

    cardContainer.on('pointerout', () => {
      if (this.gameStore.selectedCard?.id !== card.id) {
        cardContainer.y += 10;
      }
    });
  }

  private highlightSelectedCard(selectedCard: Card | null) {
    this.cards.forEach((cardContainer, cardId) => {
      if (selectedCard && cardId === selectedCard.id) {
        cardContainer.y -= 10;
        // Add glow effect
        (cardContainer as any).setTint(0xffff88);
      } else {
        (cardContainer as any).clearTint();
      }
    });
  }

  private getSuitSymbol(suit: string): string {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '?';
    }
  }

  private getCardColor(suit: string): string {
    return (suit === 'hearts' || suit === 'diamonds') ? '#ff0000' : '#000000';
  }
}