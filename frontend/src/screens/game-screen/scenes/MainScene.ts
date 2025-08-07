import Phaser from 'phaser';
import { Card } from '../../../shared/types/game.types';

export class MainScene extends Phaser.Scene {
  private cards: Phaser.GameObjects.Image[] = [];
  private sharedZone!: Phaser.GameObjects.Zone;
  private playerHand!: Phaser.GameObjects.Container;
  private opponentHand!: Phaser.GameObjects.Container;
  private isDragging = false;
  private dealButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create simple colored rectangles for cards
    this.load.image('card-back', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
    // Create card suits placeholders
    const cardWidth = 80;
    const cardHeight = 120;
    
    const graphics = this.add.graphics();
    
    // Card back
    graphics.fillStyle(0x0066cc);
    graphics.fillRect(0, 0, cardWidth, cardHeight);
    graphics.generateTexture('card-back', cardWidth, cardHeight);
    
    // Card suits
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const colors = [0xff0000, 0xff0000, 0x000000, 0x000000];
    
    suits.forEach((suit, index) => {
      graphics.clear();
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, cardWidth, cardHeight);
      graphics.fillStyle(colors[index]);
      graphics.fillRect(10, 10, cardWidth - 20, cardHeight - 20);
      graphics.generateTexture(`card-${suit}`, cardWidth, cardHeight);
    });
    
    graphics.destroy();
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Create shared zone in center
    this.sharedZone = this.add.zone(width / 2, height / 2, 400, 200);
    this.sharedZone.setRectangleDropZone(400, 200);
    
    // Visual indicator for shared zone
    const sharedZoneGraphics = this.add.graphics();
    sharedZoneGraphics.lineStyle(3, 0xffffff, 0.8);
    sharedZoneGraphics.strokeRect(width / 2 - 200, height / 2 - 100, 400, 200);
    
    const sharedZoneText = this.add.text(width / 2, height / 2 - 130, 'Shared Zone - Drop Cards Here', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Create containers for hands
    this.playerHand = this.add.container(width / 2, height - 100);
    this.opponentHand = this.add.container(width / 2, 100);

    // Deal cards button
    this.dealButton = this.add.text(50, 50, 'Deal Cards', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4CAF50',
      padding: { x: 20, y: 10 }
    })
    .setInteractive()
    .on('pointerdown', () => this.dealCards())
    .on('pointerover', () => this.dealButton.setScale(1.1))
    .on('pointerout', () => this.dealButton.setScale(1));

    // Setup drag and drop
    this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      this.isDragging = true;
      gameObject.setTint(0x888888);
    });

    this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      this.isDragging = false;
      gameObject.clearTint();
    });

    this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dropZone: Phaser.GameObjects.Zone) => {
      if (dropZone === this.sharedZone) {
        // Move card to shared zone
        gameObject.x = dropZone.x + Phaser.Math.Between(-150, 150);
        gameObject.y = dropZone.y + Phaser.Math.Between(-75, 75);
        gameObject.setTint(0x00ff00);
        
        // Emit event to notify game logic
        this.events.emit('cardDroppedInSharedZone', {
          card: gameObject.getData('cardData'),
          x: gameObject.x,
          y: gameObject.y
        });
      } else {
        // Return to original position if not dropped in valid zone
        const originalX = gameObject.getData('originalX');
        const originalY = gameObject.getData('originalY');
        gameObject.x = originalX;
        gameObject.y = originalY;
      }
    });
  }

  dealCards() {
    // Clear existing cards
    this.cards.forEach(card => card.destroy());
    this.cards = [];

    // Create player hand (bottom)
    for (let i = 0; i < 5; i++) {
      const card = this.createCard(
        (i - 2) * 90,
        0,
        'hearts',
        `${i + 1}`,
        i + 1
      );
      this.playerHand.add(card);
      this.cards.push(card);
    }

    // Create opponent hand (top) - face down
    for (let i = 0; i < 5; i++) {
      const card = this.createCard(
        (i - 2) * 90,
        0,
        'back',
        '',
        0,
        false
      );
      this.opponentHand.add(card);
      this.cards.push(card);
    }

    // Emit event to notify game logic
    this.events.emit('cardsDealt');
  }

  createCard(x: number, y: number, suit: string, rank: string, value: number, interactive = true): Phaser.GameObjects.Image {
    const textureKey = suit === 'back' ? 'card-back' : `card-${suit}`;
    const card = this.add.image(x, y, textureKey);
    
    // Store card data
    card.setData('cardData', {
      id: Phaser.Utils.String.UUID(),
      suit,
      rank,
      value
    });
    
    card.setData('originalX', x);
    card.setData('originalY', y);

    if (interactive) {
      card.setInteractive({ draggable: true });
      card.on('pointerover', () => {
        if (!this.isDragging) {
          card.setScale(1.1);
        }
      });
      card.on('pointerout', () => {
        if (!this.isDragging) {
          card.setScale(1);
        }
      });
    }

    return card;
  }

  // Method to be called from React components
  updateGameState(gameState: any) {
    // Update visual representation based on game state
    console.log('Game state updated:', gameState);
  }

  // Method to add card to shared zone from external source
  addCardToSharedZone(card: Card, x: number, y: number) {
    const cardSprite = this.createCard(x, y, card.suit, card.rank, card.value, false);
    cardSprite.setTint(0x00ff00);
  }
}