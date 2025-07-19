import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
  private cards: Phaser.GameObjects.Image[] = [];
  private sparkles: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    // Create simple card graphics for the background animation
    this.createCardTextures();
    this.createSparkleTexture();
  }

  create() {
    // Create animated background
    this.createBackground();
    
    // Create floating cards animation
    this.createFloatingCards();
    
    // Create sparkle effects
    this.createSparkleEffects();
    
    // Add title text (optional - can be hidden if React overlay covers it)
    this.createTitleText();
  }

  private createCardTextures() {
    // Create card back texture
    const cardBack = this.add.graphics();
    cardBack.fillStyle(0x1a365d);
    cardBack.fillRoundedRect(0, 0, 60, 84, 8);
    cardBack.lineStyle(2, 0x3182ce);
    cardBack.strokeRoundedRect(0, 0, 60, 84, 8);
    
    // Add card pattern
    cardBack.lineStyle(1, 0x4299e1, 0.5);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        cardBack.strokeRect(8 + i * 14, 12 + j * 15, 12, 12);
      }
    }
    
    cardBack.generateTexture('start-card-back', 60, 84);
    cardBack.destroy();

    // Create different colored card fronts
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
    colors.forEach((color, index) => {
      const cardFront = this.add.graphics();
      cardFront.fillStyle(0xffffff);
      cardFront.fillRoundedRect(0, 0, 60, 84, 8);
      cardFront.lineStyle(2, color);
      cardFront.strokeRoundedRect(0, 0, 60, 84, 8);
      
      // Add suit symbols
      cardFront.fillStyle(color);
      cardFront.fillCircle(30, 30, 8);
      cardFront.fillCircle(30, 54, 6);
      
      cardFront.generateTexture(`start-card-${index}`, 60, 84);
      cardFront.destroy();
    });
  }

  private createSparkleTexture() {
    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffffff);
    // Create a simple diamond shape instead of star
    sparkle.fillTriangle(8, 2, 14, 8, 8, 14);
    sparkle.fillTriangle(8, 2, 2, 8, 8, 14);
    sparkle.generateTexture('sparkle', 16, 16);
    sparkle.destroy();
  }

  private createBackground() {
    // Create gradient background
    const gradient = this.add.graphics();
    
    // Create multiple colored rectangles to simulate gradient
    const colors = [0x1a365d, 0x2c5282, 0x3182ce, 0x4299e1];
    const height = this.cameras.main.height / colors.length;
    
    colors.forEach((color, index) => {
      gradient.fillStyle(color, 0.8);
      gradient.fillRect(0, height * index, this.cameras.main.width, height);
    });

    // Add some decorative circles
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const radius = Phaser.Math.Between(20, 100);
      
      gradient.fillStyle(0xffffff, 0.02);
      gradient.fillCircle(x, y, radius);
    }
  }

  private createFloatingCards() {
    // Create floating cards around the screen
    for (let i = 0; i < 12; i++) {
      const cardType = Phaser.Math.Between(0, 4);
      const texture = Math.random() > 0.3 ? `start-card-${cardType}` : 'start-card-back';
      
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      
      const card = this.add.image(x, y, texture);
      card.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      card.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
      card.setRotation(Phaser.Math.FloatBetween(-0.5, 0.5));
      
      this.cards.push(card);
      
      // Animate the card
      this.tweens.add({
        targets: card,
        y: y + Phaser.Math.Between(-100, 100),
        x: x + Phaser.Math.Between(-50, 50),
        rotation: card.rotation + Phaser.Math.FloatBetween(-1, 1),
        duration: Phaser.Math.Between(8000, 15000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });

      // Fade animation
      this.tweens.add({
        targets: card,
        alpha: Phaser.Math.FloatBetween(0.05, 0.4),
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }

  private createSparkleEffects() {
    // Create occasional sparkle effects
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      
      const sparkle = this.add.sprite(x, y, 'sparkle');
      sparkle.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
      sparkle.setAlpha(0);
      
      this.sparkles.push(sparkle);
      
      // Sparkle animation
      this.tweens.add({
        targets: sparkle,
        alpha: 0.8,
        scaleX: sparkle.scaleX * 1.5,
        scaleY: sparkle.scaleY * 1.5,
        duration: 1000,
        ease: 'Sine.easeOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        repeatDelay: Phaser.Math.Between(3000, 8000)
      });

      // Rotation animation
      this.tweens.add({
        targets: sparkle,
        rotation: Math.PI * 2,
        duration: 4000,
        ease: 'Linear',
        repeat: -1
      });
    }
  }

  private createTitleText() {
    // Add subtle background text (will be covered by React UI)
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const titleShadow = this.add.text(centerX + 2, centerY - 148, '🃏 Card Game', {
      fontSize: '48px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0.1);

    const title = this.add.text(centerX, centerY - 150, '🃏 Card Game', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0.2);

    // Pulse animation for title
    this.tweens.add({
      targets: [title, titleShadow],
      alpha: title.alpha * 1.5,
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  update() {
    // Additional animations can be added here if needed
    // For example, continuous particle effects or dynamic backgrounds
  }
}