export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const ticketData: TicketData = req.body;
  const { companyId } = req.user;

  const mutex = new Mutex();
  try {
    const result = await mutex.runExclusive(async () => {
      return await UpdateTicketService({
        ticketData,
        ticketId,
        companyId
      });
    });
    
    if (!result) {
      return res.status(404).json({ error: "Ticket não encontrado ou não foi possível atualizar" });
    }
    
    return res.status(200).json(result.ticket);
  } catch (error) {
    console.error("Erro ao atualizar o ticket:", error);
    return res.status(500).json({ error: "Erro ao atualizar o ticket" });
  }
}; 