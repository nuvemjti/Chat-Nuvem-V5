import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  DataType
} from "sequelize-typescript";
import User from "./User";
import Chat from "./Chat";

@Table({ tableName: "ChatMessages" })
class ChatMessage extends Model<ChatMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Chat)
  @Column
  chatId: number;

  @ForeignKey(() => User)
  @Column
  senderId: number;

  @Column({ defaultValue: "" })
  message: string;

  @Column
  mediaType:string;
  
  @Column(DataType.STRING)
get mediaPath(): string | null {
  const mediaPathValue = this.getDataValue("mediaPath");

  if (mediaPathValue) {
    // Verifica se o mediaPath já é uma URL completa
    if (mediaPathValue.startsWith("http")) {
      return mediaPathValue;
    }

    // Constrói a URL base apenas se necessário
    const backendUrl = process.env.BACKEND_URL.replace(/\/+$/, ""); // Remove barras extras no final
    const proxyPort = process.env.PROXY_PORT ? `:${process.env.PROXY_PORT}` : "";

    return `${backendUrl}${proxyPort}/public/chats/${mediaPathValue}`;
  }

  return null;
}

  @Column
  mediaName: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Chat)
  chat: Chat;

  @BelongsTo(() => User)
  sender: User;
}

export default ChatMessage;
