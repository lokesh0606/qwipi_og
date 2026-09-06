# Qiwipi

## Overview

Qiwipi is a simple chat application that utilizes Azure OpenAI to provide streaming responses. This application is designed for seamless interaction and can be easily customized to suit various use cases. Follow the steps below to set up and run the application.

---

## Prerequisites

Before proceeding, ensure you have the following:

1. Python 3.7 or higher installed on your system.
2. An Azure OpenAI account with the necessary credentials.
3. Required permissions to access Azure services.
4. A terminal or command-line interface.

---

## Setup Instructions

### 1. Clone the Repository

Clone the Qiwipi repository to your local system:

```bash
$ git clone <repository-url>
$ cd Qiwipi
```

### 2. Configure Azure Credentials

Locate the `.env_example` file in the root directory of the project and use it to create your `.env` file with the necessary Azure credentials.

1. Rename `.env_example` to `.env`:

   ```bash
   $ mv .env_example .env
   ```

2. Open the `.env` file in your preferred text editor and fill in the required Azure credentials:
   
   ```plaintext
   AZURE_OPENAI_API_KEY= Enter Azure OpenAI API Key
   AZURE_OPENAI_DEPLOYMENT= Enter Model Name as Deployed on Azure
   AZURE_OPENAI_VERSION= Enter the Azure OpenAI API Version 
   AZURE_OPENAI_ENDPOINT= Enter the URL/Endpoint/Base of Azure OpenAI
   ```

   Replace the placeholders with the respective values from your Azure account.

### 3. Install Dependencies

Install the required Python libraries using `pip`:

```bash
$ pip install -r requirements.txt
```

Ensure all dependencies are successfully installed before proceeding.

---

## Customizing the Prompt

The prompt used in the chat application can be modified to suit your specific use case. To customize the prompt:

1. Open the `chat.py` file located in the project directory.
2. Locate the section of the code where the prompt is defined.
3. Modify the prompt as needed. For example:

   ```python
   prompt = "Hello! How can I assist you today?"
   ```

   Save the changes once you have updated the prompt.

---

## Running the Application

Start the application by executing the `chat.py` script:

```bash
$ python chat.py
```

The chat interface will be displayed, and you can interact with the application.

---

## Features

- Real-time streaming responses powered by Azure OpenAI.
- Customizable prompt to adapt to various conversational needs.
- Easy setup and configuration.

---

## Troubleshooting

### Common Issues

1. **Missing Azure Credentials**:
   Ensure the `.env` file is correctly configured with valid Azure credentials.

2. **Dependency Installation Errors**:
   Verify that you are using the correct Python version and that `pip` is updated. Run:
   
   ```bash
   $ pip install --upgrade pip
   ```

3. **Connection Issues**:
   Check your internet connection and ensure that the Azure endpoint is accessible.

### Logs

Enable debugging logs in the `chat.py` file for additional insights by modifying the logging level as needed.

---

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to enhance the functionality of Qiwipi.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

Special thanks to the Azure OpenAI team for providing the tools and resources to make this application possible.

---

## Additional Information

### `.env` File Example

The `.env` file should include the following content:

```plaintext
AZURE_OPENAI_API_KEY= Enter Azure OpenAI API Key
AZURE_OPENAI_DEPLOYMENT= Enter Model Name as Deployed on Azure
AZURE_OPENAI_VERSION= Enter the Azure OpenAI API Version 
AZURE_OPENAI_ENDPOINT= Enter the URL/Endpoint/Base of Azure OpenAI
```

### `chat.py` File Example

The `chat.py` file utilizes the Pydantic library to handle environment variables and OpenAI's SDK for interacting with the Azure OpenAI API. Below is a summary of its content:

```python
from pydantic import BaseModel
from typing import Optional
import asyncio
import openai
from dotenv import load_dotenv
import os

load_dotenv(override=True)

class AzureOpenAI(BaseModel):
    API_KEY: Optional[str] = os.getenv("AZURE_OPENAI_API_KEY")
    MODEL_NAME: Optional[str] = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    AZURE_ENDPOINT: Optional[str] = os.getenv("AZURE_OPENAI_ENDPOINT")
    API_VERSION: Optional[str] = os.getenv("AZURE_OPENAI_VERSION")

    async def llm(self):
        client = openai.AsyncAzureOpenAI(
            api_key=self.API_KEY,
            api_version=self.API_VERSION,
            azure_endpoint=self.AZURE_ENDPOINT
        )
        return client

    async def client(self, prompt):
        client = await self.llm()
        print(client)

        completion = await client.chat.completions.create(
            model=self.MODEL_NAME,
            temperature=0,
            max_tokens=500,
            n=1,
            messages=[
                {"role": "system", "content": "You are a helpful assistant!."},
                {"role": "user", "content": f"{prompt}"},
            ],
            stream=True,
        )
        
        print("Response: ")
        async for event in completion:
            if event.choices:
                content = event.choices[0].delta.content
                if content:
                    print(content, end="", flush=True)

if __name__ == "__main__":
    prompt = "Write an essay on the Universe and it's existence"
    azure = AzureOpenAI()
    asyncio.run(azure.client(prompt))
```