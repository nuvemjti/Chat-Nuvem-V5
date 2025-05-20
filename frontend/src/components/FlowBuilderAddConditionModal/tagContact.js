export const TagContact = ({ options }) => {

    return (
        <>
        {options.length > 0 && (
              <>
                {options.map((option, index) => (
                  <ConditionViewer
                    key={index}
                    option={option}
                    position={index}
                    tags={tags}
                    update={update}
                  />
                ))}
              </>
            )}
        </>
    )
}