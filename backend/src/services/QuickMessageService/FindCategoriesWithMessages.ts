import QuickMessage from "../../models/QuickMessage";

export const FindCategoriesWithMessages = async (companyId: number | string): Promise<any[]> => {
  const categories: QuickMessage[] = await QuickMessage.findAll({
    where: {
      companyId,
    },
  });

  // Converter instâncias do Sequelize para objetos JS puros
  const plainCategories = categories.map(item => item.get());

  const organizedCategories = organizeCategoriesAndMessages(plainCategories);

  return organizedCategories;
};

const organizeCategoriesAndMessages = (data: any[]) => {
  // Separar categorias (isCategory = true) e mensagens (isCategory = false)
  const categories = data.filter(item => item.isCategory === true);
  const messages = data.filter(item => item.isCategory === false);

  // Criar um novo objeto de categorias com suas mensagens associadas
  const result = categories.map(category => {
    return {
      ...category,
      messages: messages.filter(message => message.categoryId === category.id)
    };
  });

  return result;
};