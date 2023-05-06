import { usePocketBase } from "@/pocketbase";
import { useAuth } from "@/pocketbase/auth";
import { Post } from "@/pocketbase/models";
import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Drawer,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  Image,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { Record } from "pocketbase";
import React, { useEffect, useState } from "react";
import { HiDocumentDuplicate } from "react-icons/hi";
import { getRelativeTime } from "../utils/relativeTime";
import Header from "./header";
import { IMAGE_MIME_TYPE } from "@mantine/dropzone";

interface LayoutProps {
  children?: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const pb = usePocketBase();
  const { user } = useAuth();

  const [opened, { toggle, close }] = useDisclosure(false);

  const [userPosts, setUserPosts] = useState<Post[]>();

  useEffect(() => {
    user &&
      (async () => {
        const records = await pb.collection("posts").getList<Post>(1, 20, {
          filter: `author.id = "${user.id}"`,
          expand: "files,author",
          sort: "-created",
        });
        setUserPosts(records.items);
      })();
  }, [user, setUserPosts, pb]);

  return (
    <AppShell header={<Header />}>
      <Drawer
        opened={opened}
        onClose={close}
        title="My Posts"
        styles={{ header: { background: "none" } }}
      >
        <Stack>
          {userPosts?.map((post) => (
            <Paper
              key={post.id}
              bg="dark.6"
              sx={(theme) => ({
                ":hover": { background: theme.colors.dark[7] },
              })}
              shadow="md"
              p="md"
              component={Link}
              href={`/posts/${post.id}`}
            >
              <Group align="start">
                <Stack>
                  <Group sx={{ flex: 1 }}>
                    <Box>
                      <Tooltip
                        label={new Date(post.created).toLocaleString()}
                        color="dark"
                      >
                        <Text color="gray.6" size="sm">
                          {getRelativeTime(new Date(), new Date(post.created))}
                        </Text>
                      </Tooltip>
                      <Title order={3}>
                        {post.title ||
                          `Post by ${(post.expand.author as Record).username}`}
                      </Title>
                    </Box>
                    {post.public && <Badge>Public</Badge>}
                    {post.nsfw && <Badge color="red">NSFW</Badge>}
                  </Group>
                  <Text>{post.expand.files.length} Files</Text>
                </Stack>
                <Box sx={{ flexGrow: 1, width: "auto" }} />
                {Array.isArray(post.expand.files) && (
                  <Box h={100} w={100} pos="relative">
                    {IMAGE_MIME_TYPE.includes(post.expand.files[0].type) ? (
                      <Image
                        src={pb.files.getUrl(
                          post.expand.files[0],
                          post.expand.files[0].file
                        )}
                        sx={{ flex: 1 }}
                        height={100}
                        width={100}
                        alt={
                          post.title ||
                          `Post by ${(post.expand.author as Record).username}`
                        }
                      />
                    ) : (
                      <video
                        src={pb.files.getUrl(
                          post.expand.files[0],
                          post.expand.files[0].file
                        )}
                        height={100}
                        width={100}
                        muted
                        autoPlay
                        controls={false}
                      />
                    )}
                    {post.expand.files.length > 1 && (
                      <Box
                        pos="absolute"
                        sx={(theme) => ({
                          background: theme.fn.rgba(theme.colors.dark[8], 0.7),
                        })}
                        top={0}
                        right={0}
                        bottom={0}
                        left={0}
                      >
                        <Center h={100} w={100}>
                          <Box>
                            <Text size="xl">
                              {post.expand.files.length - 1} +
                            </Text>
                          </Box>
                        </Center>
                      </Box>
                    )}
                  </Box>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      </Drawer>
      {children}
      {user && (
        <ActionIcon
          pos="absolute"
          bottom={20}
          left={20}
          size="xl"
          variant="gradient"
          radius="xl"
          onClick={toggle}
        >
          <HiDocumentDuplicate size={24} />
        </ActionIcon>
      )}
    </AppShell>
  );
}

export default Layout;