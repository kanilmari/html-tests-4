from openai import OpenAI

client = OpenAI(api_key="sk-3EonDMY69hQe3oh0e3tvTS1nVwl5Tn0aJGrnzeiNwJT3BlbkFJs7GsFcgjD23JoPBA--_AFpqyrmF7p9iePwk6WgsuwA")

# Set your OpenAI API key

# Function to generate embeddings
def generate_embeddings(text):
    response = client.embeddings.create(input=text,
    model="text-embedding-ada-002"  # This is a common model used for embeddings
)
    return response.data[0].embedding

# Example text to embed
text_to_embed = "man"
print(text_to_embed)

# Generate embeddings
embedding = generate_embeddings(text_to_embed)

# Print the embedding vector
print("Embedding vector:", embedding)

# Optionally, you can inspect the length and type of the embedding
print("Embedding length:", len(embedding))
print("Embedding type:", type(embedding))

# Keep the window open
#input("Press Enter to close the window...")
